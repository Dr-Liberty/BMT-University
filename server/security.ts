import { db } from "./db";
import { 
  securityVelocityTracking, 
  walletClusters, 
  courseCompletionVelocity,
  deviceFingerprints,
  walletBlacklist,
  users,
  rewards,
  enrollments,
  postPayoutTracking,
  knownSinkAddresses,
  payoutTransactions,
  ipReputationCache,
} from "@shared/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { getOutboundTransfers, getCurrentBlockNumber } from './kasplex';

// ============ SECURITY: Safe Error Logging ============
// Prevents sensitive data (API keys, credentials) from leaking through error messages
function safeErrorLog(prefix: string, error: any): void {
  const safeError = {
    message: error?.message?.substring(0, 200) || 'Unknown error',
    code: error?.code || undefined,
  };
  console.error(prefix, JSON.stringify(safeError));
}

// ============ ANTI-ABUSE POLICY ============
// IMPORTANT: The following are NOT valid reasons for flagging/blocking wallets:
// - Completing all courses (we WANT users to complete all courses!)
// - Having high reward totals from legitimate course completions
// 
// Valid reasons for flagging/blocking:
// - Unrealistically fast course completion (less than 10% of expected time)
// - Multiple wallets from same device fingerprint (3+ wallets = blocked)
// - Multiple wallets from same IP (10+ wallets = blocked)
// - Post-payout dumping to sink addresses
// - Wallet clustering with known bad actors

// Security thresholds - STRICT after Jan 2026 farming attack
const SECURITY_THRESHOLDS = {
  MAX_WALLETS_PER_IP_24H: 1,           // STRICT: Only 1 wallet per IP (was 3)
  MAX_WALLETS_PER_FINGERPRINT_24H: 1,   // STRICT: Only 1 wallet per fingerprint (was 2)
  MIN_COURSE_COMPLETION_SECONDS: 120,   // Minimum 2 minutes per course (was 60)
  MIN_LESSON_TIME_SECONDS: 10,          // Minimum 10 seconds per lesson (was 5)
  CLUSTER_AUTO_BLOCK_THRESHOLD: 3,      // Auto-block clusters with 3+ wallets (was 5)
  CLUSTER_HIGH_RISK_THRESHOLD: 2,       // Flag as high risk at 2+ wallets (was 3)
  MAX_COMPLETIONS_PER_TIMEZONE_HOUR: 10, // Max completions from same timezone in 1 hour
  PARALLEL_COMPLETION_WINDOW_SECONDS: 60, // Detect parallel farming within 60 seconds
};

// ============ 1. WALLET CREATION VELOCITY CHECK ============
export async function checkWalletCreationVelocity(
  ip: string, 
  fingerprintHash: string | null
): Promise<{ allowed: boolean; reason?: string; riskLevel: 'low' | 'medium' | 'high' }> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check IP velocity
  const ipWallets = await db.select()
    .from(securityVelocityTracking)
    .where(and(
      eq(securityVelocityTracking.identifier, ip),
      eq(securityVelocityTracking.identifierType, 'ip'),
      eq(securityVelocityTracking.eventType, 'wallet_creation'),
      gte(securityVelocityTracking.createdAt, twentyFourHoursAgo)
    ));
  
  if (ipWallets.length >= SECURITY_THRESHOLDS.MAX_WALLETS_PER_IP_24H) {
    return {
      allowed: false,
      reason: `Too many wallets created from this IP in 24 hours (${ipWallets.length}/${SECURITY_THRESHOLDS.MAX_WALLETS_PER_IP_24H})`,
      riskLevel: 'high'
    };
  }
  
  // Check fingerprint velocity
  let fpWalletsCount = 0;
  if (fingerprintHash) {
    const fpWallets = await db.select()
      .from(securityVelocityTracking)
      .where(and(
        eq(securityVelocityTracking.identifier, fingerprintHash),
        eq(securityVelocityTracking.identifierType, 'fingerprint'),
        eq(securityVelocityTracking.eventType, 'wallet_creation'),
        gte(securityVelocityTracking.createdAt, twentyFourHoursAgo)
      ));
    
    fpWalletsCount = fpWallets.length;
    
    if (fpWalletsCount >= SECURITY_THRESHOLDS.MAX_WALLETS_PER_FINGERPRINT_24H) {
      return {
        allowed: false,
        reason: `Too many wallets created from this device in 24 hours (${fpWalletsCount}/${SECURITY_THRESHOLDS.MAX_WALLETS_PER_FINGERPRINT_24H})`,
        riskLevel: 'high'
      };
    }
  }
  
  // Determine risk level based on counts
  const ipCount = ipWallets.length;
  
  if (ipCount >= 2 || fpWalletsCount >= 1) {
    return { allowed: true, riskLevel: 'medium' };
  }
  
  return { allowed: true, riskLevel: 'low' };
}

export async function recordWalletCreation(
  walletAddress: string,
  ip: string,
  fingerprintHash: string | null
): Promise<void> {
  // Record IP-based creation
  await db.insert(securityVelocityTracking).values({
    identifier: ip,
    identifierType: 'ip',
    eventType: 'wallet_creation',
    walletAddress: walletAddress.toLowerCase(),
    eventData: { fingerprintHash },
  });
  
  // Record fingerprint-based creation
  if (fingerprintHash) {
    await db.insert(securityVelocityTracking).values({
      identifier: fingerprintHash,
      identifierType: 'fingerprint',
      eventType: 'wallet_creation',
      walletAddress: walletAddress.toLowerCase(),
      eventData: { ip },
    });
  }
}

// ============ 2. COURSE COMPLETION VELOCITY CHECK ============
export async function checkCourseCompletionVelocity(
  userId: string,
  courseId: string,
  lessonCount: number,
  courseDuration: number // Expected duration in minutes
): Promise<{ isSuspicious: boolean; reason?: string; timeSpentSeconds: number }> {
  // Get the enrollment time
  const [enrollment] = await db.select()
    .from(enrollments)
    .where(and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courseId)
    ))
    .limit(1);
  
  if (!enrollment || !enrollment.enrolledAt) {
    return { isSuspicious: false, timeSpentSeconds: 0 };
  }
  
  const enrolledAt = new Date(enrollment.enrolledAt);
  const now = new Date();
  const timeSpentSeconds = Math.floor((now.getTime() - enrolledAt.getTime()) / 1000);
  
  // Minimum expected time: at least 10 seconds per lesson
  const minExpectedSeconds = lessonCount * SECURITY_THRESHOLDS.MIN_LESSON_TIME_SECONDS;
  
  if (timeSpentSeconds < minExpectedSeconds) {
    return {
      isSuspicious: true,
      reason: `Course completed in ${timeSpentSeconds}s, minimum expected ${minExpectedSeconds}s (${lessonCount} lessons)`,
      timeSpentSeconds
    };
  }
  
  // Also check if completion is unrealistically fast (less than 20% of expected duration)
  const expectedSeconds = courseDuration * 60;
  if (timeSpentSeconds < expectedSeconds * 0.1) {
    return {
      isSuspicious: true,
      reason: `Course completed in ${Math.floor(timeSpentSeconds / 60)}min, expected ~${courseDuration}min (10% threshold)`,
      timeSpentSeconds
    };
  }
  
  return { isSuspicious: false, timeSpentSeconds };
}

export async function recordCourseCompletion(
  userId: string,
  courseId: string,
  enrolledAt: Date,
  timeSpentSeconds: number,
  lessonCount: number,
  isSuspicious: boolean,
  suspiciousReason?: string
): Promise<void> {
  await db.insert(courseCompletionVelocity).values({
    userId,
    courseId,
    enrolledAt,
    quizCompletedAt: new Date(),
    totalTimeSeconds: timeSpentSeconds,
    lessonCount,
    isSuspicious,
    suspiciousReason,
  }).onConflictDoNothing();
}

// ============ 2b. TIMEZONE PATTERN DETECTION (Anti-VPN Farming) ============
// Detects coordinated farming attacks using rotating VPNs but same timezone
export async function checkTimezoneAnomalies(
  walletAddress: string,
  timezone: string
): Promise<{ blocked: boolean; reason?: string }> {
  if (!timezone) {
    return { blocked: false };
  }
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Count recent completions from this timezone
  const result = await db.execute(sql`
    SELECT COUNT(DISTINCT pt.recipient_address) as wallet_count,
           COUNT(*) as payout_count
    FROM payout_transactions pt
    JOIN device_fingerprints df ON LOWER(pt.recipient_address) = LOWER(df.wallet_address)
    WHERE df.timezone = ${timezone}
      AND pt.created_at > ${oneHourAgo}
      AND pt.status = 'completed'
  `);
  
  const row = result.rows?.[0] as any;
  const walletCount = parseInt(row?.wallet_count || '0');
  const payoutCount = parseInt(row?.payout_count || '0');
  
  // Block if too many different wallets from same timezone in short period
  if (walletCount >= SECURITY_THRESHOLDS.MAX_COMPLETIONS_PER_TIMEZONE_HOUR) {
    console.log(`[Security] BLOCKED: Timezone anomaly detected - ${walletCount} wallets from ${timezone} in last hour`);
    return {
      blocked: true,
      reason: `Suspicious activity pattern: ${walletCount} different wallets completing courses from timezone ${timezone} in the last hour`
    };
  }
  
  return { blocked: false };
}

// ============ 2c. PARALLEL FARMING DETECTION ============
// Detects when multiple wallets complete the same course within seconds of each other
export async function checkParallelFarming(
  walletAddress: string,
  courseId: string
): Promise<{ blocked: boolean; reason?: string; linkedWallets?: string[] }> {
  const windowSeconds = SECURITY_THRESHOLDS.PARALLEL_COMPLETION_WINDOW_SECONDS;
  const windowStart = new Date(Date.now() - windowSeconds * 1000);
  
  // Find other wallets that completed the same course very recently
  const parallelCompletions = await db.execute(sql`
    SELECT DISTINCT pt.recipient_address
    FROM payout_transactions pt
    JOIN rewards r ON pt.reward_id = r.id
    WHERE r.course_id = ${courseId}
      AND pt.created_at > ${windowStart}
      AND LOWER(pt.recipient_address) != LOWER(${walletAddress})
      AND pt.status = 'completed'
  `);
  
  if (parallelCompletions.rows && parallelCompletions.rows.length > 0) {
    const linkedWallets = parallelCompletions.rows.map((r: any) => r.recipient_address);
    console.log(`[Security] PARALLEL FARMING detected: ${walletAddress} completed ${courseId} within ${windowSeconds}s of ${linkedWallets.join(', ')}`);
    
    // If 2+ wallets completed the same course at the same time, it's likely farming
    if (linkedWallets.length >= 1) {
      return {
        blocked: true,
        reason: `Parallel farming detected: Multiple wallets completing same course within ${windowSeconds} seconds`,
        linkedWallets
      };
    }
  }
  
  return { blocked: false };
}

// ============ 2d. PRE-PAYOUT SECURITY CHECK ============
// Comprehensive check before approving any payout
export async function prePayoutSecurityCheck(
  walletAddress: string,
  courseId: string,
  userId: string,
  timezone?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const normalizedWallet = walletAddress.toLowerCase();
  
  // 1. Check if wallet is blacklisted
  const [blacklisted] = await db.select()
    .from(walletBlacklist)
    .where(and(
      eq(sql`LOWER(${walletBlacklist.walletAddress})`, normalizedWallet),
      eq(walletBlacklist.isActive, true)
    ))
    .limit(1);
  
  if (blacklisted) {
    console.log(`[Security] BLOCKED: Wallet ${walletAddress} is blacklisted - ${blacklisted.reason}`);
    return { allowed: false, reason: 'Wallet is blocked due to suspicious activity' };
  }
  
  // 2. Check if user is banned
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (user?.isBanned) {
    console.log(`[Security] BLOCKED: User ${userId} is banned - ${user.banReason}`);
    return { allowed: false, reason: 'Account is suspended' };
  }
  
  // 3. Check timezone anomalies (anti-VPN farming)
  if (timezone) {
    const tzCheck = await checkTimezoneAnomalies(normalizedWallet, timezone);
    if (tzCheck.blocked) {
      return { allowed: false, reason: tzCheck.reason };
    }
  }
  
  // 4. Check parallel farming
  const parallelCheck = await checkParallelFarming(normalizedWallet, courseId);
  if (parallelCheck.blocked) {
    // Auto-blacklist the wallet and linked wallets
    await autoBlacklistWallet(normalizedWallet, 'Parallel farming detected', parallelCheck.linkedWallets || []);
    return { allowed: false, reason: parallelCheck.reason };
  }
  
  return { allowed: true };
}

// Auto-blacklist a wallet and optionally link related wallets
async function autoBlacklistWallet(
  walletAddress: string,
  reason: string,
  linkedWallets: string[] = []
): Promise<void> {
  const allWallets = [walletAddress.toLowerCase(), ...linkedWallets.map(w => w.toLowerCase())];
  
  for (const wallet of allWallets) {
    await db.insert(walletBlacklist).values({
      id: crypto.randomUUID(),
      walletAddress: wallet,
      reason: 'Auto-blocked: ' + reason,
      description: `Linked wallets: ${allWallets.join(', ')}`,
      severity: 'high',
      flaggedBy: 'system_autoblock',
      isActive: true,
      linkedWallets: allWallets,
    }).onConflictDoUpdate({
      target: walletBlacklist.walletAddress,
      set: {
        isActive: true,
        reason: 'Auto-blocked: ' + reason,
        updatedAt: new Date(),
      }
    });
  }
  
  console.log(`[Security] Auto-blacklisted ${allWallets.length} wallets: ${allWallets.join(', ')}`);
}

// ============ 3. CLUSTER DETECTION ============
export async function detectAndUpdateClusters(): Promise<{ clustersFound: number; walletsAffected: number }> {
  // Find all fingerprints shared by multiple wallets
  const sharedFingerprints = await db.execute(sql`
    SELECT fingerprint_hash, 
           array_agg(DISTINCT LOWER(wallet_address)) as wallets,
           COUNT(DISTINCT LOWER(wallet_address)) as wallet_count
    FROM device_fingerprints
    WHERE fingerprint_hash IS NOT NULL 
      AND fingerprint_hash != ''
      AND wallet_address NOT LIKE '0xdead%'
    GROUP BY fingerprint_hash
    HAVING COUNT(DISTINCT LOWER(wallet_address)) >= 2
    ORDER BY wallet_count DESC
  `);
  
  // Find all IPs shared by multiple wallets
  const sharedIps = await db.execute(sql`
    SELECT ip_address,
           array_agg(DISTINCT LOWER(wallet_address)) as wallets,
           COUNT(DISTINCT LOWER(wallet_address)) as wallet_count
    FROM device_fingerprints
    WHERE ip_address IS NOT NULL 
      AND ip_address != ''
      AND ip_address != 'unknown'
      AND wallet_address NOT LIKE '0xdead%'
    GROUP BY ip_address
    HAVING COUNT(DISTINCT LOWER(wallet_address)) >= 3
    ORDER BY wallet_count DESC
  `);
  
  let clustersFound = 0;
  let walletsAffected = 0;
  const processedWallets = new Set<string>();
  
  // Process fingerprint-based clusters
  for (const row of sharedFingerprints.rows as any[]) {
    const wallets = row.wallets as string[];
    const fingerprintHash = row.fingerprint_hash;
    
    if (wallets.length < 2) continue;
    
    // Check if cluster already exists
    const existingCluster = await db.select()
      .from(walletClusters)
      .where(sql`${walletClusters.sharedFingerprints} @> ${JSON.stringify([fingerprintHash])}::jsonb`)
      .limit(1);
    
    if (existingCluster.length === 0) {
      // Calculate total rewards for this cluster
      const rewardsResult = await db.execute(sql`
        SELECT COALESCE(SUM(r.amount), 0) as total
        FROM rewards r
        JOIN users u ON r.user_id = u.id
        WHERE LOWER(u.wallet_address) = ANY(${wallets})
      `);
      const totalRewards = (rewardsResult.rows[0] as any)?.total || 0;
      
      // Calculate risk score
      const riskScore = Math.min(100, wallets.length * 20 + (totalRewards > 100000 ? 30 : 0));
      const shouldAutoBlock = wallets.length >= SECURITY_THRESHOLDS.CLUSTER_AUTO_BLOCK_THRESHOLD;
      
      // Create cluster record
      await db.insert(walletClusters).values({
        clusterName: `FP-Cluster-${fingerprintHash.substring(0, 8)}`,
        walletAddresses: wallets,
        sharedFingerprints: [fingerprintHash],
        totalWallets: wallets.length,
        totalRewardsEarned: totalRewards,
        riskScore,
        status: shouldAutoBlock ? 'blocked' : (wallets.length >= SECURITY_THRESHOLDS.CLUSTER_HIGH_RISK_THRESHOLD ? 'detected' : 'detected'),
        autoBlocked: shouldAutoBlock,
        blockedReason: shouldAutoBlock ? `Auto-blocked: ${wallets.length} wallets sharing same device fingerprint` : null,
      });
      
      // If auto-blocked, add all wallets to blacklist
      if (shouldAutoBlock) {
        for (const wallet of wallets) {
          if (!processedWallets.has(wallet)) {
            await db.insert(walletBlacklist)
              .values({
                walletAddress: wallet,
                reason: 'cluster_detected',
                description: `Part of cluster with ${wallets.length} wallets sharing fingerprint`,
                severity: 'blocked',
                linkedWallets: wallets.filter(w => w !== wallet),
                flaggedBy: 'automated',
              })
              .onConflictDoNothing();
            processedWallets.add(wallet);
            walletsAffected++;
          }
        }
      }
      
      clustersFound++;
    }
  }
  
  // Process IP-based clusters (higher threshold)
  for (const row of sharedIps.rows as any[]) {
    const wallets = row.wallets as string[];
    const ipAddress = row.ip_address;
    
    if (wallets.length < 5) continue; // Higher threshold for IP-based detection
    
    // Check if cluster already exists
    const existingCluster = await db.select()
      .from(walletClusters)
      .where(sql`${walletClusters.sharedIps} @> ${JSON.stringify([ipAddress])}::jsonb`)
      .limit(1);
    
    if (existingCluster.length === 0) {
      const rewardsResult = await db.execute(sql`
        SELECT COALESCE(SUM(r.amount), 0) as total
        FROM rewards r
        JOIN users u ON r.user_id = u.id
        WHERE LOWER(u.wallet_address) = ANY(${wallets})
      `);
      const totalRewards = (rewardsResult.rows[0] as any)?.total || 0;
      
      const riskScore = Math.min(100, wallets.length * 15 + (totalRewards > 100000 ? 20 : 0));
      const shouldAutoBlock = wallets.length >= 10; // Higher threshold for IP-based
      
      await db.insert(walletClusters).values({
        clusterName: `IP-Cluster-${ipAddress.replace(/\./g, '-')}`,
        walletAddresses: wallets,
        sharedIps: [ipAddress],
        totalWallets: wallets.length,
        totalRewardsEarned: totalRewards,
        riskScore,
        status: shouldAutoBlock ? 'blocked' : 'detected',
        autoBlocked: shouldAutoBlock,
        blockedReason: shouldAutoBlock ? `Auto-blocked: ${wallets.length} wallets from same IP` : null,
      });
      
      if (shouldAutoBlock) {
        for (const wallet of wallets) {
          if (!processedWallets.has(wallet)) {
            await db.insert(walletBlacklist)
              .values({
                walletAddress: wallet,
                reason: 'cluster_detected',
                description: `Part of cluster with ${wallets.length} wallets from same IP`,
                severity: 'blocked',
                linkedWallets: wallets.filter(w => w !== wallet),
                flaggedBy: 'automated',
              })
              .onConflictDoNothing();
            processedWallets.add(wallet);
            walletsAffected++;
          }
        }
      }
      
      clustersFound++;
    }
  }
  
  return { clustersFound, walletsAffected };
}

// ============ 4. POST-PAYOUT MONITORING ============

// Thresholds for dump detection
const DUMP_THRESHOLDS = {
  INSTANT_DUMP_SECONDS: 300, // 5 minutes = instant dump
  QUICK_DUMP_SECONDS: 3600, // 1 hour = quick dump
  DAY_DUMP_SECONDS: 86400, // 24 hours = same-day dump
  NEW_SINK_THRESHOLD: 3, // 3+ unique flagged wallets sending to same address = new sink
};

// Flag a wallet for rapid dump activity
export async function flagSuspiciousPostPayoutActivity(
  walletAddress: string,
  payoutTxHash: string,
  destinationAddress: string,
  timeToTransferSeconds: number
): Promise<void> {
  const normalizedWallet = walletAddress.toLowerCase();
  const normalizedDest = destinationAddress.toLowerCase();
  
  // Determine severity based on how fast they dumped
  let severity: 'flagged' | 'blocked' = 'flagged';
  let reason = 'rapid_dump';
  
  if (timeToTransferSeconds < DUMP_THRESHOLDS.INSTANT_DUMP_SECONDS) {
    severity = 'blocked'; // Block instant dumpers
    reason = 'instant_dump';
  }
  
  await db.insert(walletBlacklist)
    .values({
      walletAddress: normalizedWallet,
      reason,
      description: `Dumped rewards within ${Math.round(timeToTransferSeconds / 60)} minutes to ${normalizedDest}`,
      severity,
      evidenceTxHashes: [payoutTxHash],
      flaggedBy: 'automated',
    })
    .onConflictDoUpdate({
      target: walletBlacklist.walletAddress,
      set: {
        reason,
        description: `Dumped rewards within ${Math.round(timeToTransferSeconds / 60)} minutes`,
        severity,
        updatedAt: new Date(),
      },
    });
    
  console.log(`[Security] Flagged wallet ${normalizedWallet} for ${reason} (${timeToTransferSeconds}s to dump)`);
}

// Update sink address statistics - tracks UNIQUE senders only
async function updateSinkAddress(
  address: string, 
  amountReceived: number,
  senderWallet: string
): Promise<void> {
  const normalizedAddress = address.toLowerCase();
  const normalizedSender = senderWallet.toLowerCase();
  
  // Check if sink already exists
  const existing = await db.select()
    .from(knownSinkAddresses)
    .where(eq(knownSinkAddresses.address, normalizedAddress))
    .limit(1);
    
  if (existing.length > 0) {
    // Check if this sender has already been counted for this sink
    const existingTracking = await db.select()
      .from(postPayoutTracking)
      .where(and(
        eq(postPayoutTracking.firstHopDestination, normalizedAddress),
        eq(postPayoutTracking.recipientAddress, normalizedSender)
      ))
      .limit(2); // Get 2 to check if this is a repeat
    
    // Only increment uniqueSenders if this is the FIRST time this sender dumped to this sink
    const isNewSender = existingTracking.length <= 1; // 1 means just recorded, 0 means error
    
    await db.update(knownSinkAddresses)
      .set({
        totalReceived: sql`${knownSinkAddresses.totalReceived} + ${amountReceived}`,
        uniqueSenders: isNewSender 
          ? sql`${knownSinkAddresses.uniqueSenders} + 1`
          : knownSinkAddresses.uniqueSenders, // Don't increment for repeat senders
        updatedAt: new Date(),
      })
      .where(eq(knownSinkAddresses.address, normalizedAddress));
  } else {
    // Create new potential sink record
    await db.insert(knownSinkAddresses)
      .values({
        address: normalizedAddress,
        addressType: 'unknown',
        label: `Potential Sink (from ${normalizedSender.slice(0, 10)}...)`,
        totalReceived: amountReceived,
        uniqueSenders: 1,
        isFlagged: false,
      })
      .onConflictDoNothing();
  }
}

// Check if an address is a known sink
async function isKnownSink(address: string): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  const sink = await db.select()
    .from(knownSinkAddresses)
    .where(and(
      eq(knownSinkAddresses.address, normalizedAddress),
      eq(knownSinkAddresses.isFlagged, true)
    ))
    .limit(1);
  return sink.length > 0;
}

// Auto-detect new sink addresses
async function detectNewSinks(): Promise<number> {
  // Find addresses that have received from 3+ flagged wallets
  const potentialSinks = await db.select()
    .from(knownSinkAddresses)
    .where(and(
      eq(knownSinkAddresses.isFlagged, false),
      gte(knownSinkAddresses.uniqueSenders, DUMP_THRESHOLDS.NEW_SINK_THRESHOLD)
    ));
    
  let sinksDetected = 0;
  
  for (const sink of potentialSinks) {
    await db.update(knownSinkAddresses)
      .set({
        isFlagged: true,
        addressType: 'sink_wallet',
        label: `Auto-detected Sink (${sink.uniqueSenders} senders)`,
        updatedAt: new Date(),
      })
      .where(eq(knownSinkAddresses.id, sink.id));
    
    console.log(`[Security] Auto-flagged new sink address: ${sink.address} (${sink.uniqueSenders} unique senders)`);
    sinksDetected++;
  }
  
  return sinksDetected;
}

// Main monitoring job: Check recent payouts for dump activity
export async function runPostPayoutMonitoring(
  tokenAddress: string,
  hoursToCheck: number = 24
): Promise<{
  payoutsChecked: number;
  dumpsDetected: number;
  walletsBlocked: number;
  newSinksFound: number;
}> {
  console.log(`[Security] Running post-payout monitoring for last ${hoursToCheck}h...`);
  
  const cutoffTime = new Date(Date.now() - hoursToCheck * 60 * 60 * 1000);
  
  // Get recent successful payouts that haven't been tracked yet
  const recentPayouts = await db.select()
    .from(payoutTransactions)
    .where(and(
      eq(payoutTransactions.status, 'confirmed'),
      gte(payoutTransactions.createdAt, cutoffTime)
    ))
    .limit(100); // Process in batches
    
  let payoutsChecked = 0;
  let dumpsDetected = 0;
  let walletsBlocked = 0;
  
  for (const payout of recentPayouts) {
    // Skip if already tracked
    const existingTracking = await db.select()
      .from(postPayoutTracking)
      .where(eq(postPayoutTracking.payoutTransactionId, payout.id))
      .limit(1);
      
    if (existingTracking.length > 0 && existingTracking[0].trackingStatus !== 'pending') {
      continue;
    }
    
    payoutsChecked++;
    
    // Get outbound transfers from this recipient
    const transfers = await getOutboundTransfers(
      payout.recipientAddress,
      tokenAddress
    );
    
    if (transfers.length === 0) {
      // No outbound transfers yet - mark as tracked/clean for now
      if (existingTracking.length === 0) {
        await db.insert(postPayoutTracking).values({
          payoutTransactionId: payout.id,
          recipientAddress: payout.recipientAddress.toLowerCase(),
          trackingStatus: 'tracked',
          lastCheckedAt: new Date(),
        });
      }
      continue;
    }
    
    // Find the first outbound transfer after the payout
    const payoutBlock = payout.blockNumber || 0;
    const outboundAfterPayout = transfers.filter(t => t.blockNumber > payoutBlock);
    
    if (outboundAfterPayout.length === 0) {
      continue;
    }
    
    const firstTransfer = outboundAfterPayout[0];
    
    // Estimate time between payout and first transfer (rough: ~2 sec per block on Kasplex)
    const blockDiff = firstTransfer.blockNumber - payoutBlock;
    const estimatedSeconds = blockDiff * 2; // Kasplex ~2 second block time
    
    // Check if destination is a known sink
    const isToSink = await isKnownSink(firstTransfer.to);
    
    // Parse transfer amount
    let transferAmount = 0;
    try {
      transferAmount = parseInt(firstTransfer.amount, 16);
    } catch {}
    
    // Record in tracking table
    const isSuspicious = estimatedSeconds < DUMP_THRESHOLDS.DAY_DUMP_SECONDS || isToSink;
    
    await db.insert(postPayoutTracking)
      .values({
        payoutTransactionId: payout.id,
        recipientAddress: payout.recipientAddress.toLowerCase(),
        trackingStatus: isSuspicious ? 'suspicious' : 'clean',
        firstHopDestination: firstTransfer.to.toLowerCase(),
        firstHopAmount: transferAmount,
        firstHopTxHash: firstTransfer.txHash,
        timeToFirstTransfer: estimatedSeconds,
        destinationType: isToSink ? 'lp_pool' : 'wallet',
        isSuspicious,
        suspiciousReason: isSuspicious 
          ? (isToSink ? 'Sent to known sink/LP' : `Dumped in ${Math.round(estimatedSeconds / 60)} minutes`)
          : null,
        lastCheckedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: postPayoutTracking.payoutTransactionId,
        set: {
          trackingStatus: isSuspicious ? 'suspicious' : 'clean',
          firstHopDestination: firstTransfer.to.toLowerCase(),
          firstHopAmount: transferAmount,
          firstHopTxHash: firstTransfer.txHash,
          timeToFirstTransfer: estimatedSeconds,
          isSuspicious,
          lastCheckedAt: new Date(),
        },
      });
    
    // If suspicious, flag the wallet and track the destination
    if (isSuspicious) {
      dumpsDetected++;
      
      // Flag the wallet
      if (estimatedSeconds < DUMP_THRESHOLDS.QUICK_DUMP_SECONDS) {
        await flagSuspiciousPostPayoutActivity(
          payout.recipientAddress,
          payout.txHash || '',
          firstTransfer.to,
          estimatedSeconds
        );
        
        if (estimatedSeconds < DUMP_THRESHOLDS.INSTANT_DUMP_SECONDS) {
          walletsBlocked++;
        }
      }
      
      // Update sink address tracking
      await updateSinkAddress(
        firstTransfer.to,
        transferAmount,
        payout.recipientAddress
      );
    }
  }
  
  // Auto-detect new sink addresses
  const newSinksFound = await detectNewSinks();
  
  console.log(`[Security] Post-payout monitoring complete: ${payoutsChecked} checked, ${dumpsDetected} dumps, ${walletsBlocked} blocked, ${newSinksFound} new sinks`);
  
  return {
    payoutsChecked,
    dumpsDetected,
    walletsBlocked,
    newSinksFound,
  };
}

// Get cluster info for a wallet
export async function getWalletClusterInfo(walletAddress: string): Promise<{
  inCluster: boolean;
  clusterSize?: number;
  riskScore?: number;
  isBlocked?: boolean;
}> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  const clusters = await db.select()
    .from(walletClusters)
    .where(sql`${walletClusters.walletAddresses} @> ${JSON.stringify([normalizedAddress])}::jsonb`);
  
  if (clusters.length > 0) {
    const cluster = clusters[0];
    return {
      inCluster: true,
      clusterSize: cluster.totalWallets,
      riskScore: cluster.riskScore,
      isBlocked: cluster.autoBlocked,
    };
  }
  
  return { inCluster: false };
}

// Run all security checks (can be called periodically)
export async function runSecurityScan(): Promise<{
  clustersFound: number;
  walletsBlocked: number;
  suspiciousCompletions: number;
}> {
  console.log('[Security] Running security scan...');
  
  // 1. Detect clusters
  const clusterResult = await detectAndUpdateClusters();
  console.log(`[Security] Found ${clusterResult.clustersFound} new clusters, affected ${clusterResult.walletsAffected} wallets`);
  
  // 2. Check for suspicious course completions
  const suspiciousCompletions = await db.select()
    .from(courseCompletionVelocity)
    .where(eq(courseCompletionVelocity.isSuspicious, true));
  
  console.log(`[Security] Found ${suspiciousCompletions.length} suspicious course completions`);
  
  return {
    clustersFound: clusterResult.clustersFound,
    walletsBlocked: clusterResult.walletsAffected,
    suspiciousCompletions: suspiciousCompletions.length,
  };
}

// ============ IP REPUTATION CHECKING ============
// Uses IPQualityScore API to detect VPNs, proxies, datacenters, etc.

const IP_REPUTATION_CONFIG = {
  CACHE_HOURS: 24, // Cache results for 24 hours
  HIGH_FRAUD_SCORE: 75, // Score >= 75 is high risk
  MEDIUM_FRAUD_SCORE: 50, // Score >= 50 is medium risk
  BLOCK_ON_VPN: true, // Block VPN users from claiming rewards
  BLOCK_ON_PROXY: true, // Block proxy users from claiming rewards
  BLOCK_ON_TOR: true, // Block Tor users
  BLOCK_ON_DATACENTER: true, // Block datacenter IPs
  BLOCK_ON_HIGH_FRAUD: true, // Block high fraud score
};

export type IpReputationResult = {
  isClean: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isBot: boolean;
  fraudScore: number;
  countryCode: string | null;
  isp: string | null;
  blockReason?: string;
  cached: boolean;
};

// Check IP reputation from cache or API
export async function checkIpReputation(ipAddress: string): Promise<IpReputationResult> {
  // Normalize IP
  const normalizedIp = ipAddress.trim().toLowerCase();
  
  // Skip check for localhost/private IPs
  if (isPrivateIp(normalizedIp)) {
    return {
      isClean: true,
      riskLevel: 'low',
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      isBot: false,
      fraudScore: 0,
      countryCode: null,
      isp: 'Local',
      cached: false,
    };
  }
  
  // Check cache first
  const cached = await getCachedIpReputation(normalizedIp);
  if (cached) {
    const result = buildResultFromCache(cached);
    result.cached = true;
    return result;
  }
  
  // Query IPQualityScore API
  const apiResult = await queryIpQualityScore(normalizedIp);
  
  // Cache the result
  await cacheIpReputation(normalizedIp, apiResult);
  
  return apiResult;
}

// Check if IP is private/local
function isPrivateIp(ip: string): boolean {
  return (
    ip === 'localhost' ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.')
  );
}

// Get cached IP reputation
async function getCachedIpReputation(ip: string) {
  const now = new Date();
  
  const cached = await db.select()
    .from(ipReputationCache)
    .where(eq(ipReputationCache.ipAddress, ip))
    .limit(1);
    
  if (cached.length === 0) return null;
  
  const record = cached[0];
  
  // Check if expired
  if (record.expiresAt && record.expiresAt < now) {
    // Delete expired cache
    await db.delete(ipReputationCache)
      .where(eq(ipReputationCache.id, record.id));
    return null;
  }
  
  return record;
}

// Build result from cached data
function buildResultFromCache(cached: typeof ipReputationCache.$inferSelect): IpReputationResult {
  const result: IpReputationResult = {
    isClean: true,
    riskLevel: cached.riskLevel as 'low' | 'medium' | 'high' | 'blocked',
    isVpn: cached.isVpn,
    isProxy: cached.isProxy,
    isTor: cached.isTor,
    isDatacenter: cached.isDatacenter,
    isBot: cached.isBot,
    fraudScore: cached.fraudScore || 0,
    countryCode: cached.countryCode || null,
    isp: cached.isp || null,
    cached: true,
  };
  
  // Determine if blocked
  const blockReasons: string[] = [];
  
  if (IP_REPUTATION_CONFIG.BLOCK_ON_VPN && cached.isVpn) {
    blockReasons.push('VPN detected');
  }
  if (IP_REPUTATION_CONFIG.BLOCK_ON_PROXY && cached.isProxy) {
    blockReasons.push('Proxy detected');
  }
  if (IP_REPUTATION_CONFIG.BLOCK_ON_TOR && cached.isTor) {
    blockReasons.push('Tor network detected');
  }
  if (IP_REPUTATION_CONFIG.BLOCK_ON_DATACENTER && cached.isDatacenter) {
    blockReasons.push('Datacenter/hosting IP');
  }
  if (IP_REPUTATION_CONFIG.BLOCK_ON_HIGH_FRAUD && (cached.fraudScore || 0) >= IP_REPUTATION_CONFIG.HIGH_FRAUD_SCORE) {
    blockReasons.push('High fraud score');
  }
  
  if (blockReasons.length > 0) {
    result.isClean = false;
    result.riskLevel = 'blocked';
    result.blockReason = blockReasons.join(', ');
  }
  
  return result;
}

// Query IPQualityScore API
async function queryIpQualityScore(ip: string): Promise<IpReputationResult> {
  const apiKey = process.env.IPQUALITYSCORE_API_KEY || process.env.IPQS_API_KEY;
  
  // If no API key, return permissive result (allow but log warning)
  if (!apiKey) {
    console.warn('[Security] IPQUALITYSCORE_API_KEY not configured, skipping IP reputation check');
    return {
      isClean: true,
      riskLevel: 'low',
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      isBot: false,
      fraudScore: 0,
      countryCode: null,
      isp: null,
      cached: false,
    };
  }
  
  try {
    const url = `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}?strictness=1&allow_public_access_points=true&fast=true&lighter_penalties=false&mobile=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      console.error('[Security] IPQS API error:', data.message);
      return {
        isClean: true,
        riskLevel: 'low',
        isVpn: false,
        isProxy: false,
        isTor: false,
        isDatacenter: false,
        isBot: false,
        fraudScore: 0,
        countryCode: null,
        isp: null,
        cached: false,
      };
    }
    
    // Parse response
    const isVpn = data.vpn === true;
    const isProxy = data.proxy === true;
    const isTor = data.tor === true;
    const isDatacenter = data.is_crawler === true || data.host?.includes('datacenter') || data.host?.includes('hosting');
    const isBot = data.bot_status === true;
    const fraudScore = data.fraud_score || 0;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'blocked' = 'low';
    const blockReasons: string[] = [];
    
    if (fraudScore >= IP_REPUTATION_CONFIG.HIGH_FRAUD_SCORE) {
      riskLevel = 'high';
    } else if (fraudScore >= IP_REPUTATION_CONFIG.MEDIUM_FRAUD_SCORE) {
      riskLevel = 'medium';
    }
    
    // Check blocking conditions
    if (IP_REPUTATION_CONFIG.BLOCK_ON_VPN && isVpn) {
      blockReasons.push('VPN detected');
      riskLevel = 'blocked';
    }
    if (IP_REPUTATION_CONFIG.BLOCK_ON_PROXY && isProxy) {
      blockReasons.push('Proxy detected');
      riskLevel = 'blocked';
    }
    if (IP_REPUTATION_CONFIG.BLOCK_ON_TOR && isTor) {
      blockReasons.push('Tor network detected');
      riskLevel = 'blocked';
    }
    if (IP_REPUTATION_CONFIG.BLOCK_ON_DATACENTER && isDatacenter) {
      blockReasons.push('Datacenter/hosting IP');
      riskLevel = 'blocked';
    }
    if (IP_REPUTATION_CONFIG.BLOCK_ON_HIGH_FRAUD && fraudScore >= IP_REPUTATION_CONFIG.HIGH_FRAUD_SCORE) {
      blockReasons.push('High fraud score');
      riskLevel = 'blocked';
    }
    
    const result: IpReputationResult = {
      isClean: blockReasons.length === 0,
      riskLevel,
      isVpn,
      isProxy,
      isTor,
      isDatacenter,
      isBot,
      fraudScore,
      countryCode: data.country_code || null,
      isp: data.ISP || null,
      cached: false,
    };
    
    if (blockReasons.length > 0) {
      result.blockReason = blockReasons.join(', ');
    }
    
    console.log(`[Security] IP ${ip} reputation: score=${fraudScore}, vpn=${isVpn}, proxy=${isProxy}, datacenter=${isDatacenter}, risk=${riskLevel}`);
    
    return result;
    
  } catch (error) {
    // SECURITY: Don't log full error - could contain API key in URL
    safeErrorLog('[Security] Error querying IPQS:', error);
    // Return permissive result on error
    return {
      isClean: true,
      riskLevel: 'low',
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      isBot: false,
      fraudScore: 0,
      countryCode: null,
      isp: null,
      cached: false,
    };
  }
}

// Cache IP reputation result
async function cacheIpReputation(ip: string, result: IpReputationResult): Promise<void> {
  const expiresAt = new Date(Date.now() + IP_REPUTATION_CONFIG.CACHE_HOURS * 60 * 60 * 1000);
  
  await db.insert(ipReputationCache)
    .values({
      ipAddress: ip,
      isVpn: result.isVpn,
      isProxy: result.isProxy,
      isTor: result.isTor,
      isDatacenter: result.isDatacenter,
      isBot: result.isBot,
      fraudScore: result.fraudScore,
      countryCode: result.countryCode,
      isp: result.isp,
      riskLevel: result.riskLevel,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: ipReputationCache.ipAddress,
      set: {
        isVpn: result.isVpn,
        isProxy: result.isProxy,
        isTor: result.isTor,
        isDatacenter: result.isDatacenter,
        isBot: result.isBot,
        fraudScore: result.fraudScore,
        countryCode: result.countryCode,
        isp: result.isp,
        riskLevel: result.riskLevel,
        checkedAt: new Date(),
        expiresAt,
      },
    });
}

// Get IP reputation stats for admin
export async function getIpReputationStats(): Promise<{
  totalChecked: number;
  blockedIps: number;
  vpnCount: number;
  proxyCount: number;
  torCount: number;
  datacenterCount: number;
  avgFraudScore: number;
}> {
  const allRecords = await db.select().from(ipReputationCache);
  
  const blocked = allRecords.filter(r => r.riskLevel === 'blocked');
  const vpns = allRecords.filter(r => r.isVpn);
  const proxies = allRecords.filter(r => r.isProxy);
  const tors = allRecords.filter(r => r.isTor);
  const datacenters = allRecords.filter(r => r.isDatacenter);
  
  const avgFraudScore = allRecords.length > 0
    ? allRecords.reduce((sum, r) => sum + (r.fraudScore || 0), 0) / allRecords.length
    : 0;
  
  return {
    totalChecked: allRecords.length,
    blockedIps: blocked.length,
    vpnCount: vpns.length,
    proxyCount: proxies.length,
    torCount: tors.length,
    datacenterCount: datacenters.length,
    avgFraudScore: Math.round(avgFraudScore),
  };
}

// Admin function to list suspicious IPs
export async function getSuspiciousIps(): Promise<typeof ipReputationCache.$inferSelect[]> {
  return db.select()
    .from(ipReputationCache)
    .where(sql`${ipReputationCache.riskLevel} IN ('medium', 'high', 'blocked')`)
    .orderBy(desc(ipReputationCache.fraudScore));
}

// ============ DATA RETENTION POLICIES ============
// Configurable retention periods for security data

const DATA_RETENTION_DAYS = {
  velocityTracking: 7,       // Wallet creation velocity records
  ipReputationCache: 30,     // IP reputation cache
  courseCompletionVelocity: 90,  // Course completion velocity
  postPayoutTracking: 90,    // Post-payout monitoring data
};

export async function cleanupExpiredSecurityData(): Promise<{
  velocityDeleted: number;
  ipCacheDeleted: number;
  completionVelocityDeleted: number;
}> {
  const now = new Date();
  
  // Cleanup velocity tracking (7 days old)
  const velocityCutoff = new Date(now.getTime() - DATA_RETENTION_DAYS.velocityTracking * 24 * 60 * 60 * 1000);
  const velocityResult = await db.delete(securityVelocityTracking)
    .where(sql`${securityVelocityTracking.createdAt} < ${velocityCutoff}`);
  
  // Cleanup expired IP reputation cache
  const ipCacheCutoff = new Date(now.getTime() - DATA_RETENTION_DAYS.ipReputationCache * 24 * 60 * 60 * 1000);
  const ipResult = await db.delete(ipReputationCache)
    .where(sql`${ipReputationCache.checkedAt} < ${ipCacheCutoff} OR ${ipReputationCache.expiresAt} < ${now}`);
  
  // Cleanup old course completion velocity (90 days)
  const completionCutoff = new Date(now.getTime() - DATA_RETENTION_DAYS.courseCompletionVelocity * 24 * 60 * 60 * 1000);
  const completionResult = await db.delete(courseCompletionVelocity)
    .where(sql`${courseCompletionVelocity.createdAt} < ${completionCutoff}`);
  
  return {
    velocityDeleted: 0, // Can't get count from drizzle delete
    ipCacheDeleted: 0,
    completionVelocityDeleted: 0,
  };
}

// Run data retention cleanup periodically (every 6 hours)
setInterval(async () => {
  try {
    const result = await cleanupExpiredSecurityData();
    console.log('[Security] Data retention cleanup completed:', result);
  } catch (error) {
    safeErrorLog('[Security] Data retention cleanup failed:', error);
  }
}, 6 * 60 * 60 * 1000);

// Export retention config for admin visibility
export function getDataRetentionConfig() {
  return DATA_RETENTION_DAYS;
}
