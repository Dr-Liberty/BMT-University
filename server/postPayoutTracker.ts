import { db } from "./db";
import { 
  payoutTransactions, 
  postPayoutTracking, 
  knownSinkAddresses,
  users
} from "@shared/schema";
import { eq, and, desc, gte, isNull } from "drizzle-orm";
import { getOutboundTransfers, type TokenTransfer } from './kasplex';

const BMT_TOKEN_ADDRESS = process.env.BMT_TOKEN_ADDRESS || '0x422a0b6b76B47eA56aB3D4f854ABB92d31783c91';

interface WalletTrackingResult {
  walletAddress: string;
  totalBmtReceived: number;
  totalBmtSent: number;
  holdingBalance: number;
  transferCount: number;
  firstRewardAt: Date | null;
  firstSellAt: Date | null;
  holdTimeHours: number | null;
  destinations: { address: string; amount: number; blockNumber: number }[];
  isSeller: boolean;
  sellPercentage: number;
}

interface TrackingReport {
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  totalWalletsTracked: number;
  totalBmtDistributed: number;
  totalBmtSold: number;
  sellPercentage: number;
  averageHoldTimeHours: number;
  diamondHands: number;
  paperHands: number;
  holdersGained: number;
  topSellers: WalletTrackingResult[];
  topHolders: WalletTrackingResult[];
}

async function getKnownSinkAddresses(): Promise<Set<string>> {
  const sinks = await db.select().from(knownSinkAddresses).where(eq(knownSinkAddresses.isFlagged, true));
  return new Set(sinks.map(s => s.address.toLowerCase()));
}

export async function trackWalletPostPayout(walletAddress: string): Promise<WalletTrackingResult> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  const payouts = await db.select()
    .from(payoutTransactions)
    .where(and(
      eq(payoutTransactions.recipientAddress, walletAddress),
      eq(payoutTransactions.status, 'completed')
    ))
    .orderBy(payoutTransactions.processedAt);
  
  const totalBmtReceived = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const firstRewardAt = payouts.length > 0 ? payouts[0].processedAt : null;
  
  const outboundTransfers = await getOutboundTransfers(walletAddress, BMT_TOKEN_ADDRESS);
  
  let totalBmtSent = 0;
  let firstSellBlockNumber = Infinity;
  const destinations: { address: string; amount: number; blockNumber: number }[] = [];
  
  for (const tx of outboundTransfers) {
    const amount = parseInt(tx.amount) / 1e18;
    totalBmtSent += amount;
    
    if (tx.blockNumber < firstSellBlockNumber) {
      firstSellBlockNumber = tx.blockNumber;
    }
    
    destinations.push({
      address: tx.to,
      amount,
      blockNumber: tx.blockNumber,
    });
  }
  
  let holdTimeHours: number | null = null;
  let firstSellAt: Date | null = null;
  
  if (firstRewardAt && outboundTransfers.length > 0) {
    firstSellAt = new Date();
    holdTimeHours = (Date.now() - firstRewardAt.getTime()) / (1000 * 60 * 60);
  }
  
  const holdingBalance = totalBmtReceived - totalBmtSent;
  const isSeller = totalBmtSent > 0;
  const sellPercentage = totalBmtReceived > 0 ? (totalBmtSent / totalBmtReceived) * 100 : 0;
  
  return {
    walletAddress,
    totalBmtReceived,
    totalBmtSent,
    holdingBalance,
    transferCount: outboundTransfers.length,
    firstRewardAt,
    firstSellAt,
    holdTimeHours,
    destinations,
    isSeller,
    sellPercentage,
  };
}

export async function generateTrackingReport(daysBack: number = 7): Promise<TrackingReport> {
  const periodEnd = new Date();
  const periodStart = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  const confirmedPayouts = await db.select({
    recipientAddress: payoutTransactions.recipientAddress,
    amount: payoutTransactions.amount,
    processedAt: payoutTransactions.processedAt,
  })
    .from(payoutTransactions)
    .where(and(
      eq(payoutTransactions.status, 'completed'),
      gte(payoutTransactions.processedAt, periodStart)
    ));
  
  const walletPayouts = new Map<string, number>();
  let totalBmtDistributed = 0;
  
  for (const payout of confirmedPayouts) {
    const addr = payout.recipientAddress;
    const amount = payout.amount || 0;
    walletPayouts.set(addr, (walletPayouts.get(addr) || 0) + amount);
    totalBmtDistributed += amount;
  }
  
  const uniqueWallets = Array.from(walletPayouts.keys());
  console.log(`[PostPayoutTracker] Tracking ${uniqueWallets.length} wallets via RPC eth_getLogs...`);
  
  const trackingResults: WalletTrackingResult[] = [];
  let processedCount = 0;
  
  for (const wallet of uniqueWallets) {
    try {
      const result = await trackWalletPostPayout(wallet);
      trackingResults.push(result);
      processedCount++;
      
      if (processedCount % 10 === 0) {
        console.log(`[PostPayoutTracker] Processed ${processedCount}/${uniqueWallets.length} wallets`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[PostPayoutTracker] Error tracking wallet ${wallet.slice(0, 10)}:`, error);
    }
  }
  
  let totalBmtSold = 0;
  let totalHoldTime = 0;
  let holdTimeCount = 0;
  let diamondHands = 0;
  let paperHands = 0;
  
  for (const result of trackingResults) {
    totalBmtSold += result.totalBmtSent;
    
    if (result.holdTimeHours !== null) {
      totalHoldTime += result.holdTimeHours;
      holdTimeCount++;
    }
    
    if (result.sellPercentage < 10) {
      diamondHands++;
    } else if (result.sellPercentage > 50) {
      paperHands++;
    }
  }
  
  const sellPercentage = totalBmtDistributed > 0 ? (totalBmtSold / totalBmtDistributed) * 100 : 0;
  const averageHoldTimeHours = holdTimeCount > 0 ? totalHoldTime / holdTimeCount : 0;
  
  const newUsers = await db.select()
    .from(users)
    .where(and(
      gte(users.createdAt, periodStart)
    ));
  const holdersGained = newUsers.filter(u => !u.walletAddress?.toLowerCase().startsWith('0xdead')).length;
  
  const topSellers = [...trackingResults]
    .filter(r => r.isSeller)
    .sort((a, b) => b.totalBmtSent - a.totalBmtSent)
    .slice(0, 10);
  
  const topHolders = [...trackingResults]
    .sort((a, b) => b.holdingBalance - a.holdingBalance)
    .slice(0, 10);
  
  return {
    generatedAt: new Date(),
    periodStart,
    periodEnd,
    totalWalletsTracked: uniqueWallets.length,
    totalBmtDistributed,
    totalBmtSold,
    sellPercentage,
    averageHoldTimeHours,
    diamondHands,
    paperHands,
    holdersGained,
    topSellers,
    topHolders,
  };
}

export async function getQuickStats(daysBack: number = 7): Promise<{
  totalDistributed: number;
  uniqueRecipients: number;
  newHolders: number;
  estimatedSellPressure: string;
}> {
  const periodStart = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  const confirmedPayouts = await db.select({
    recipientAddress: payoutTransactions.recipientAddress,
    amount: payoutTransactions.amount,
  })
    .from(payoutTransactions)
    .where(and(
      eq(payoutTransactions.status, 'completed'),
      gte(payoutTransactions.processedAt, periodStart)
    ));
  
  const uniqueWallets = new Set(confirmedPayouts.map(p => p.recipientAddress));
  const totalDistributed = confirmedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const newUsers = await db.select()
    .from(users)
    .where(gte(users.createdAt, periodStart));
  const newHolders = newUsers.filter(u => !u.walletAddress?.toLowerCase().startsWith('0xdead')).length;
  
  return {
    totalDistributed,
    uniqueRecipients: uniqueWallets.size,
    newHolders,
    estimatedSellPressure: 'Run full tracking report to calculate',
  };
}
