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
} from "@shared/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

// Security thresholds
const SECURITY_THRESHOLDS = {
  MAX_WALLETS_PER_IP_24H: 3,
  MAX_WALLETS_PER_FINGERPRINT_24H: 2,
  MIN_COURSE_COMPLETION_SECONDS: 60, // Minimum 1 minute per lesson
  MIN_LESSON_TIME_SECONDS: 10, // Minimum 10 seconds per lesson
  CLUSTER_AUTO_BLOCK_THRESHOLD: 5, // Auto-block clusters with 5+ wallets
  CLUSTER_HIGH_RISK_THRESHOLD: 3, // Flag as high risk at 3+ wallets
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
// Note: This would require integration with a blockchain explorer API
// For now, we'll create the structure for manual review
export async function flagSuspiciousPostPayoutActivity(
  walletAddress: string,
  payoutTxHash: string,
  destinationAddress: string,
  timeToTransferSeconds: number
): Promise<void> {
  // If transfer happened within 5 minutes, flag as suspicious
  if (timeToTransferSeconds < 300) {
    await db.insert(walletBlacklist)
      .values({
        walletAddress: walletAddress.toLowerCase(),
        reason: 'rapid_dump',
        description: `Transferred rewards within ${timeToTransferSeconds}s of receiving to ${destinationAddress}`,
        severity: 'flagged',
        evidenceTxHashes: [payoutTxHash],
        flaggedBy: 'automated',
      })
      .onConflictDoUpdate({
        target: walletBlacklist.walletAddress,
        set: {
          reason: 'rapid_dump',
          description: `Transferred rewards within ${timeToTransferSeconds}s of receiving`,
          updatedAt: new Date(),
        },
      });
  }
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
