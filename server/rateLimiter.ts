import { db } from "./db";
import { rateLimitStore, userThrottleStore, requestDedupeStore, claimNonces } from "@shared/schema";
import { eq, lt, and } from "drizzle-orm";
import { randomBytes } from "crypto";

const RATE_LIMITS = {
  auth: { window: 15 * 60 * 1000, maxRequests: 10 },
  quiz: { window: 60 * 1000, maxRequests: 5 },
  quizSubmit: { window: 5 * 1000, maxRequests: 1 },
  rewards: { window: 60 * 1000, maxRequests: 10 },
  rewardClaim: { window: 10 * 1000, maxRequests: 1 },
  referrals: { window: 60 * 1000, maxRequests: 20 },
  referralApply: { window: 60 * 1000, maxRequests: 3 },
  general: { window: 60 * 1000, maxRequests: 60 },
};

export type RateLimitType = keyof typeof RATE_LIMITS;

export async function checkRateLimit(key: string, limitType: RateLimitType = 'general'): Promise<boolean> {
  const now = new Date();
  const limit = RATE_LIMITS[limitType];
  const expiresAt = new Date(now.getTime() + limit.window);
  
  try {
    const existing = await db.select()
      .from(rateLimitStore)
      .where(eq(rateLimitStore.key, key))
      .limit(1);
    
    if (!existing.length || now > new Date(existing[0].expiresAt!)) {
      await db.insert(rateLimitStore)
        .values({
          key,
          limitType,
          requestCount: 1,
          windowStart: now,
          expiresAt,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: rateLimitStore.key,
          set: {
            requestCount: 1,
            windowStart: now,
            expiresAt,
            updatedAt: now,
          },
        });
      return true;
    }
    
    if (existing[0].requestCount >= limit.maxRequests) {
      return false;
    }
    
    await db.update(rateLimitStore)
      .set({
        requestCount: existing[0].requestCount + 1,
        updatedAt: now,
      })
      .where(eq(rateLimitStore.key, key));
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed, allowing request:', error);
    return true;
  }
}

export async function checkUserThrottle(userId: string, action: string, minIntervalMs: number): Promise<boolean> {
  const key = `${userId}:${action}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 1000);
  
  try {
    const existing = await db.select()
      .from(userThrottleStore)
      .where(eq(userThrottleStore.key, key))
      .limit(1);
    
    if (existing.length) {
      const lastAction = new Date(existing[0].lastActionAt);
      if (now.getTime() - lastAction.getTime() < minIntervalMs) {
        return false;
      }
    }
    
    await db.insert(userThrottleStore)
      .values({ key, lastActionAt: now, expiresAt })
      .onConflictDoUpdate({
        target: userThrottleStore.key,
        set: { lastActionAt: now, expiresAt },
      });
    
    return true;
  } catch (error) {
    console.error('Throttle check failed, allowing request:', error);
    return true;
  }
}

export async function isDuplicateRequest(hash: string, windowMs: number = 5000): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  
  try {
    const existing = await db.select()
      .from(requestDedupeStore)
      .where(eq(requestDedupeStore.requestHash, hash))
      .limit(1);
    
    if (existing.length && now < new Date(existing[0].expiresAt)) {
      return true;
    }
    
    await db.insert(requestDedupeStore)
      .values({ requestHash: hash, expiresAt })
      .onConflictDoUpdate({
        target: requestDedupeStore.requestHash,
        set: { createdAt: now, expiresAt },
      });
    
    return false;
  } catch (error) {
    console.error('Dedupe check failed, allowing request:', error);
    return false;
  }
}

export function generateRequestHash(userId: string, action: string, ...params: any[]): string {
  return `${userId}:${action}:${params.join(':')}`;
}

export async function generateClaimNonce(userId: string, rewardId: string): Promise<string> {
  const nonce = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 1000); // 60-second validity for replay resistance
  
  await db.insert(claimNonces).values({
    nonce,
    userId,
    rewardId,
    purpose: 'reward_claim',
    expiresAt,
  });
  
  return nonce;
}

export async function validateAndConsumeNonce(
  nonce: string, 
  userId: string, 
  rewardId: string
): Promise<{ valid: boolean; reason?: string }> {
  const now = new Date();
  
  try {
    const [existing] = await db.select()
      .from(claimNonces)
      .where(eq(claimNonces.nonce, nonce))
      .limit(1);
    
    if (!existing) {
      return { valid: false, reason: 'Invalid nonce' };
    }
    
    if (existing.userId !== userId) {
      return { valid: false, reason: 'Nonce belongs to different user' };
    }
    
    if (existing.rewardId !== rewardId) {
      return { valid: false, reason: 'Nonce belongs to different reward' };
    }
    
    if (existing.isUsed) {
      return { valid: false, reason: 'Nonce already used' };
    }
    
    if (now > new Date(existing.expiresAt)) {
      return { valid: false, reason: 'Nonce expired' };
    }
    
    await db.update(claimNonces)
      .set({ isUsed: true, usedAt: now })
      .where(eq(claimNonces.nonce, nonce));
    
    return { valid: true };
  } catch (error) {
    console.error('Nonce validation failed:', error);
    return { valid: false, reason: 'Validation error' };
  }
}

const TIMESTAMP_MAX_AGE_MS = 5 * 60 * 1000; // 5-minute window for signature validity

export function validateTimestampFreshness(timestamp: number): { valid: boolean; reason?: string } {
  const now = Date.now();
  const age = now - timestamp;
  
  // Reject timestamps more than 30 seconds in the future (clock skew tolerance)
  if (timestamp > now + 30000) {
    return { valid: false, reason: 'Timestamp is in the future' };
  }
  
  // Reject timestamps older than 5 minutes
  if (age > TIMESTAMP_MAX_AGE_MS) {
    return { valid: false, reason: `Signature expired (${Math.round(age / 1000)}s old, max ${TIMESTAMP_MAX_AGE_MS / 1000}s)` };
  }
  
  return { valid: true };
}

export async function cleanupExpiredRecords(): Promise<{ deleted: { rateLimits: number; throttles: number; dedupes: number; nonces: number } }> {
  const now = new Date();
  
  try {
    const rateLimitResult = await db.delete(rateLimitStore)
      .where(lt(rateLimitStore.expiresAt, now));
    
    const throttleResult = await db.delete(userThrottleStore)
      .where(lt(userThrottleStore.expiresAt, now));
    
    const dedupeResult = await db.delete(requestDedupeStore)
      .where(lt(requestDedupeStore.expiresAt, now));
    
    const nonceResult = await db.delete(claimNonces)
      .where(lt(claimNonces.expiresAt, now));
    
    return {
      deleted: {
        rateLimits: 0,
        throttles: 0,
        dedupes: 0,
        nonces: 0,
      }
    };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return { deleted: { rateLimits: 0, throttles: 0, dedupes: 0, nonces: 0 } };
  }
}

setInterval(async () => {
  await cleanupExpiredRecords();
}, 5 * 60 * 1000);

export { RATE_LIMITS };
