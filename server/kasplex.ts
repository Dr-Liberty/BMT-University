import { ethers } from 'ethers';
import { db } from "./db";
import { paymasterAuditLog, paymasterCircuitBreaker } from "@shared/schema";
import { desc, gte } from "drizzle-orm";

// ============ NONCE MANAGER (Race Condition Prevention) ============
// SECURITY: Serializes payouts to prevent concurrent nonce collisions
// Without this, two simultaneous payouts could use the same nonce,
// causing the second transaction to fail with "nonce too low"

interface NonceResetEvent {
  timestamp: Date;
  reason: string;
  errorCode?: number;
}

class NonceManager {
  private lock: Promise<void> = Promise.resolve();
  private localNonce: number | null = null;
  private lastNonceTime: number = 0;
  private readonly NONCE_STALE_MS = 30000; // Refresh from chain every 30s
  
  // Monitoring: Track nonce resets for RPC instability detection
  private resetHistory: NonceResetEvent[] = [];
  private readonly RESET_HISTORY_MAX = 100;
  private readonly INSTABILITY_THRESHOLD = 5; // Resets in window = instability
  private readonly INSTABILITY_WINDOW_MS = 60000; // 1 minute window
  
  // Acquire exclusive lock for transaction submission
  async acquireLock<T>(fn: () => Promise<T>): Promise<T> {
    // Queue this operation after all pending operations
    const previousLock = this.lock;
    let releaseLock: () => void;
    this.lock = new Promise((resolve) => { releaseLock = resolve; });
    
    await previousLock;
    try {
      return await fn();
    } finally {
      releaseLock!();
    }
  }
  
  // Get next nonce, using local tracking to avoid race conditions
  async getNextNonce(walletAddress: string, fetchFn: () => Promise<number>): Promise<number> {
    const now = Date.now();
    
    // If local nonce is stale or unset, fetch from chain
    if (this.localNonce === null || (now - this.lastNonceTime) > this.NONCE_STALE_MS) {
      this.localNonce = await fetchFn();
      this.lastNonceTime = now;
      console.log(`[NonceManager] Fetched nonce from chain: ${this.localNonce}`);
    }
    
    const nonce = this.localNonce;
    this.localNonce++; // Increment for next transaction
    return nonce;
  }
  
  // Handle nonce errors - reset and refetch
  // Handles both string messages and structured RPC errors
  handleNonceError(error: string | any): boolean {
    // Normalize error to string for checking
    let errorStr = '';
    if (typeof error === 'string') {
      errorStr = error.toLowerCase();
    } else if (error?.message) {
      errorStr = error.message.toLowerCase();
    }
    
    // Also check error.data.message for nested RPC errors
    if (error?.data?.message) {
      errorStr += ' ' + error.data.message.toLowerCase();
    }
    
    // Check error codes commonly used for nonce issues
    const nonceErrorCodes = [-32000, -32003, -32010]; // Common JSON-RPC error codes for nonce/gas issues
    const hasNonceErrorCode = error?.code && nonceErrorCodes.includes(error.code);
    
    const isNonceError = errorStr.includes('nonce') ||
                         errorStr.includes('replacement') ||
                         errorStr.includes('underpriced') ||
                         errorStr.includes('already known') ||
                         hasNonceErrorCode;
    
    if (isNonceError) {
      console.log('[NonceManager] Nonce error detected, resetting local cache');
      this.localNonce = null;
      this.lastNonceTime = 0;
      
      // Track reset for monitoring
      this.recordReset(errorStr.slice(0, 100), error?.code);
      
      // Check for RPC instability and alert
      if (this.isUnstable()) {
        console.error('[NonceManager] WARNING: RPC instability detected! Multiple nonce resets in short window.');
      }
      
      return true;
    }
    return false;
  }
  
  // Force refresh on next call (manual invalidation)
  invalidate(reason: string = 'manual'): void {
    console.log(`[NonceManager] Manual cache invalidation: ${reason}`);
    this.localNonce = null;
    this.lastNonceTime = 0;
    this.recordReset(reason);
  }
  
  // Record a nonce reset event for monitoring and audit log
  private recordReset(reason: string, errorCode?: number): void {
    this.resetHistory.push({
      timestamp: new Date(),
      reason,
      errorCode,
    });
    
    // Trim history to max size
    if (this.resetHistory.length > this.RESET_HISTORY_MAX) {
      this.resetHistory = this.resetHistory.slice(-this.RESET_HISTORY_MAX);
    }
    
    // Persist to audit log for production monitoring (async, fire-and-forget)
    this.persistToAuditLog(reason, errorCode).catch(err => {
      console.error('[NonceManager] Failed to persist reset to audit log:', err);
    });
  }
  
  // Persist nonce reset event to database for production auditing
  private async persistToAuditLog(reason: string, errorCode?: number): Promise<void> {
    try {
      await db.insert(paymasterAuditLog).values({
        operation: 'nonce_reset',
        toAddress: 'system',
        amount: '0',
        txHash: null,
        status: this.isUnstable() ? 'warning' : 'info',
        metadata: {
          reason: reason.slice(0, 200),
          errorCode,
          recentResets: this.resetHistory.filter(
            r => Date.now() - r.timestamp.getTime() < this.INSTABILITY_WINDOW_MS
          ).length,
          isUnstable: this.isUnstable(),
        },
      });
    } catch (error) {
      // Don't throw - audit log failure shouldn't block transactions
      console.error('[NonceManager] Audit log persistence error:', error);
    }
  }
  
  // Check if RPC is unstable (many resets in short window)
  isUnstable(): boolean {
    const now = Date.now();
    const recentResets = this.resetHistory.filter(
      r => now - r.timestamp.getTime() < this.INSTABILITY_WINDOW_MS
    );
    return recentResets.length >= this.INSTABILITY_THRESHOLD;
  }
  
  // Get status for admin monitoring
  getStatus(): {
    currentNonce: number | null;
    cacheAge: number;
    isStale: boolean;
    isUnstable: boolean;
    recentResets: number;
    totalResets: number;
    lastResets: NonceResetEvent[];
  } {
    const now = Date.now();
    const cacheAge = this.lastNonceTime ? now - this.lastNonceTime : 0;
    const recentResets = this.resetHistory.filter(
      r => now - r.timestamp.getTime() < this.INSTABILITY_WINDOW_MS
    ).length;
    
    return {
      currentNonce: this.localNonce,
      cacheAge,
      isStale: cacheAge > this.NONCE_STALE_MS,
      isUnstable: this.isUnstable(),
      recentResets,
      totalResets: this.resetHistory.length,
      lastResets: this.resetHistory.slice(-10), // Last 10 resets
    };
  }
}

// Singleton nonce manager for the paymaster wallet
const nonceManager = new NonceManager();

// Export for admin endpoints
export function getNonceManagerStatus() {
  return nonceManager.getStatus();
}

export function invalidateNonceCache(reason: string = 'admin_request') {
  nonceManager.invalidate(reason);
  return { success: true, message: `Nonce cache invalidated: ${reason}` };
}

// Network configuration - toggle between testnet and mainnet
// Default to mainnet for production use with real BMT token
const USE_TESTNET = process.env.KASPLEX_NETWORK === 'testnet';

const NETWORKS = {
  testnet: {
    rpc: 'https://rpc.kasplextest.xyz',
    chainId: 167012,
    name: 'kasplex-testnet',
    explorer: 'https://frontend.kasplextest.xyz',
  },
  mainnet: {
    rpc: 'https://evmrpc.kasplex.org',
    chainId: 202555,
    name: 'kasplex-l2',
    explorer: 'https://explorer.kasplex.org',
  },
};

const ACTIVE_NETWORK = USE_TESTNET ? NETWORKS.testnet : NETWORKS.mainnet;
const KASPLEX_EVM_RPC = ACTIVE_NETWORK.rpc;
const KASPLEX_CHAIN_ID = ACTIVE_NETWORK.chainId;

export function getNetworkInfo() {
  return {
    network: USE_TESTNET ? 'testnet' : 'mainnet',
    chainId: ACTIVE_NETWORK.chainId,
    rpc: ACTIVE_NETWORK.rpc,
    explorer: ACTIVE_NETWORK.explorer,
  };
}

const ERC20_BALANCE_OF_ABI = '0x70a08231';
const ERC20_DECIMALS_ABI = '0x313ce567';
const ERC20_SYMBOL_ABI = '0x95d89b41';
const ERC20_NAME_ABI = '0x06fdde03';
const ERC20_TOTAL_SUPPLY_ABI = '0x18160ddd';
const ERC20_TRANSFER_ABI = '0xa9059cbb';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

let provider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(KASPLEX_EVM_RPC, {
      chainId: KASPLEX_CHAIN_ID,
      name: ACTIVE_NETWORK.name,
    });
  }
  return provider;
}

function getPaymasterPrivateKey(): string | null {
  return process.env.PAYMASTER_PRIVATE_KEY || null;
}

export function isPaymasterConfigured(): boolean {
  return !!getPaymasterPrivateKey();
}

export function getPaymasterWalletAddress(): string | null {
  const privateKey = getPaymasterPrivateKey();
  if (!privateKey) return null;
  
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    console.error('Invalid paymaster private key:', error);
    return null;
  }
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

// Helper to get nonce via raw RPC call (Kasplex compatibility)
// Uses 'pending' to include unconfirmed transactions and avoid nonce collisions
// SECURITY: Throws on failure to prevent nonce=0 replay attacks
async function getRawNonce(walletAddress: string, usePending: boolean = true): Promise<number> {
  try {
    const blockTag = usePending ? 'pending' : 'latest';
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionCount',
        params: [walletAddress, blockTag],
      }),
    });
    
    const data = await response.json();
    if (data.result) {
      return parseInt(data.result, 16);
    }
    
    // Fallback to 'latest' if 'pending' fails
    if (usePending) {
      return getRawNonce(walletAddress, false);
    }
    
    // SECURITY: Fail hard instead of defaulting to 0 (prevents replay attacks)
    throw new Error('RPC_NONCE_FAILURE: Could not retrieve nonce from network');
  } catch (error: any) {
    // Fallback to 'latest' on error (only once)
    if (usePending && !error.message?.includes('RPC_NONCE_FAILURE')) {
      return getRawNonce(walletAddress, false);
    }
    // Re-throw to prevent transaction with potentially wrong nonce
    throw new Error(`Failed to get transaction nonce: ${error.message || 'Network unavailable'}`);
  }
}

// Broadcast-only transfer result (no confirmation wait)
export interface BroadcastResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Submit transaction without waiting for confirmation (fast, for async flows)
// SECURITY: Uses NonceManager lock to prevent concurrent nonce collisions
// retryAttempt: 0 = first try (8x gas), 1 = second try (10x gas), etc.
export async function submitTransferERC20(
  tokenContract: string,
  toAddress: string,
  amount: string,
  decimals: number = 18,
  retryAttempt: number = 0
): Promise<BroadcastResult> {
  const privateKey = getPaymasterPrivateKey();
  
  if (!privateKey) {
    return { success: false, error: 'Paymaster private key not configured' };
  }

  // CRITICAL: Acquire lock to serialize transaction submissions
  // This prevents race conditions where two payouts get the same nonce
  return nonceManager.acquireLock(async () => {
    const maxNonceRetries = 3;
    let lastError = '';
    
    for (let nonceRetry = 0; nonceRetry < maxNonceRetries; nonceRetry++) {
      try {
        const wallet = new ethers.Wallet(privateKey);
        const walletAddress = wallet.address;
        const amountBigInt = BigInt(amount);
        
        // Log transfer initiation (condensed for production)
        console.log(`[Payout] Transfer attempt ${retryAttempt + 1}${nonceRetry > 0 ? ` (nonce retry ${nonceRetry})` : ''}: ${formatTokenAmount(amount, decimals)} tokens to ${toAddress.slice(0, 8)}...`);
        
        // Get nonce using NonceManager (tracks locally, fetches when stale)
        const nonce = await nonceManager.getNextNonce(walletAddress, () => getRawNonce(walletAddress));
        
        // Gas multiplier: 8x base + 2x per retry attempt (more aggressive for reliability)
        // Attempt 0: 8x (~16000 gwei, ~1.6 KAS), Attempt 1: 10x (~20000 gwei, ~2 KAS), etc.
        const gasMultiplier = BigInt(8 + retryAttempt * 2);
        const networkGasPrice = await getNetworkGasPrice();
        const gasPrice = networkGasPrice * gasMultiplier;
        console.log(`  Gas price: ${Number(gasPrice) / 1e9} gwei (${gasMultiplier}x), nonce: ${nonce}`);
        
        // Encode the transfer function call
        const iface = new ethers.Interface(ERC20_ABI);
        const data = iface.encodeFunctionData('transfer', [toAddress, amountBigInt]);
        
        // Use EIP-1559 transaction
        const tx = {
          to: tokenContract,
          data: data,
          nonce: nonce,
          gasLimit: 100000n,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice / 2n,
          chainId: KASPLEX_CHAIN_ID,
          type: 2,
        };
        
        // Sign and broadcast
        const signedTx = await wallet.signTransaction(tx);
        
        const sendResponse = await fetch(KASPLEX_EVM_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_sendRawTransaction',
            params: [signedTx],
          }),
        });
        
        const sendData = await sendResponse.json();
        
        if (sendData.error) {
          const errorMsg = sendData.error.message || 'Transaction rejected';
          console.error('[FastSubmit] RPC error:', sendData.error);
          
          // Check if this is a nonce-related error - pass full error object for code/data checks
          if (nonceManager.handleNonceError(sendData.error) && nonceRetry < maxNonceRetries - 1) {
            console.log(`[FastSubmit] Retrying with fresh nonce (attempt ${nonceRetry + 2}/${maxNonceRetries})`);
            lastError = errorMsg;
            continue; // Retry with fresh nonce
          }
          
          return { success: false, error: errorMsg };
        }
        
        const txHash = sendData.result;
        console.log(`[FastSubmit] Transaction broadcast: ${txHash}`);
        
        return { success: true, txHash };
      } catch (error: any) {
        console.error('[FastSubmit] Error:', error);
        lastError = error.message || 'Broadcast failed';
        
        // Check if this is a nonce-related error - pass full error object
        if (nonceManager.handleNonceError(error) && nonceRetry < maxNonceRetries - 1) {
          console.log(`[FastSubmit] Retrying with fresh nonce (attempt ${nonceRetry + 2}/${maxNonceRetries})`);
          continue;
        }
        
        return { success: false, error: lastError };
      }
    }
    
    return { success: false, error: `Max nonce retries exceeded: ${lastError}` };
  });
}

// Check transaction confirmation status
export async function checkTransactionStatus(txHash: string): Promise<{ confirmed: boolean; success?: boolean; blockNumber?: number }> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    
    const data = await response.json();
    
    if (!data.result) {
      return { confirmed: false };
    }
    
    const receipt = data.result;
    return {
      confirmed: true,
      success: receipt.status !== '0x0',
      blockNumber: parseInt(receipt.blockNumber, 16),
    };
  } catch (error) {
    console.error('Error checking transaction:', error);
    return { confirmed: false };
  }
}

// Get current network gas price
async function getNetworkGasPrice(): Promise<bigint> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: [],
      }),
    });
    
    const data = await response.json();
    if (data.result) {
      return BigInt(data.result);
    }
    // Fallback to 2000 gwei if RPC fails (Kasplex default)
    return 2000000000000n;
  } catch (error) {
    console.error('Failed to get gas price:', error);
    return 2000000000000n; // 2000 gwei fallback
  }
}

// Internal function to attempt a single transfer
// Returns rawError for proper nonce error detection by caller
async function attemptTransfer(
  wallet: ethers.Wallet,
  tokenContract: string,
  toAddress: string,
  amount: string,
  decimals: number,
  gasMultiplier: bigint,
  nonceOverride?: number
): Promise<TransferResult & { shouldRetry?: boolean; rawError?: any }> {
  const walletAddress = wallet.address;
  const amountBigInt = BigInt(amount);
  
  // Get nonce using raw RPC call (Kasplex compatibility)
  const nonce = nonceOverride ?? await getRawNonce(walletAddress);
  
  // Get current network gas price (Kasplex uses ~2000 gwei)
  const networkGasPrice = await getNetworkGasPrice();
  const gasPrice = networkGasPrice * gasMultiplier;
  console.log(`  Attempt with ${gasMultiplier}x gas: ${Number(gasPrice) / 1e9} gwei, nonce: ${nonce}`);
  
  // Encode the transfer function call
  const iface = new ethers.Interface(ERC20_ABI);
  const data = iface.encodeFunctionData('transfer', [toAddress, amountBigInt]);
  
  // Use EIP-1559 transaction (type 2) - works on Kasplex L2
  const tx = {
    to: tokenContract,
    data: data,
    nonce: nonce,
    gasLimit: 100000n, // ERC-20 transfers typically use 50-70k gas
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: gasPrice / 2n,
    chainId: KASPLEX_CHAIN_ID,
    type: 2, // EIP-1559 transaction
  };
  
  // Sign transaction
  const signedTx = await wallet.signTransaction(tx);
  
  // Send raw transaction via RPC
  const sendResponse = await fetch(KASPLEX_EVM_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendRawTransaction',
      params: [signedTx],
    }),
  });
  
  const sendData = await sendResponse.json();
  
  if (sendData.error) {
    console.error('RPC error:', sendData.error);
    const errorMsg = sendData.error.message || '';
    
    // Check for nonce-related errors and reset cache for caller
    const isNonceError = nonceManager.handleNonceError(sendData.error);
    
    // Check if we should retry with higher gas
    const shouldRetry = isNonceError ||
                        errorMsg.includes('underpriced') || 
                        errorMsg.includes('gas');
    return {
      success: false,
      error: sendData.error.message || 'Transaction rejected by network',
      shouldRetry,
      rawError: sendData.error, // Include full error object for caller
    };
  }
  
  const txHash = sendData.result;
  console.log(`Transaction submitted: ${txHash}`);
  
  // Wait for confirmation (15 seconds per attempt to fit within browser timeout)
  let receipt = null;
  let attempts = 0;
  const maxAttempts = 15;
  
  while (!receipt && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    
    const receiptResponse = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    
    const receiptData = await receiptResponse.json();
    if (receiptData.result) {
      receipt = receiptData.result;
    }
  }
  
  if (receipt) {
    const blockNumber = parseInt(receipt.blockNumber, 16);
    const gasUsed = parseInt(receipt.gasUsed, 16).toString();
    console.log(`Transaction confirmed in block ${blockNumber}`);
    console.log(`Gas used: ${gasUsed}`);
    
    // Check if transaction was successful
    if (receipt.status === '0x0') {
      return {
        success: false,
        error: 'Transaction reverted on chain',
        shouldRetry: false,
      };
    }
    
    return {
      success: true,
      txHash: txHash,
      gasUsed: gasUsed,
      blockNumber: blockNumber,
    };
  } else {
    // Transaction submitted but NOT confirmed - may retry with higher gas
    console.error(`Transaction NOT confirmed after ${maxAttempts} seconds: ${txHash}`);
    return {
      success: false,
      error: 'Transaction not confirmed within timeout',
      txHash: txHash,
      shouldRetry: true,
    };
  }
}

// Synchronous transfer with confirmation wait (for admin payouts)
// SECURITY: Uses NonceManager lock to prevent concurrent nonce collisions
export async function transferERC20(
  tokenContract: string,
  toAddress: string,
  amount: string,
  decimals: number = 18
): Promise<TransferResult> {
  const privateKey = getPaymasterPrivateKey();
  
  if (!privateKey) {
    return {
      success: false,
      error: 'Paymaster private key not configured. Set PAYMASTER_PRIVATE_KEY environment secret.',
    };
  }

  // CRITICAL: Acquire lock to serialize transaction submissions
  // This prevents race conditions where two payouts get the same nonce
  return nonceManager.acquireLock(async () => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const walletAddress = wallet.address;
      
      // Log transfer initiation (condensed for production)
      console.log(`[Payout] Sync transfer: ${formatTokenAmount(amount, decimals)} tokens to ${toAddress.slice(0, 8)}...`);
      
      // Progressive gas multipliers for retries (Kasplex RPC can be finicky)
      // Limited to 3 attempts to fit within browser timeout (~45s total)
      // More aggressive multipliers for reliability: 8x, 12x, 16x
      const gasMultipliers = [8n, 12n, 16n];
      
      for (let i = 0; i < gasMultipliers.length; i++) {
        // Get nonce from NonceManager (local tracking to avoid races)
        const nonce = await nonceManager.getNextNonce(walletAddress, () => getRawNonce(walletAddress));
        
        const result = await attemptTransfer(
          wallet,
          tokenContract,
          toAddress,
          amount,
          decimals,
          gasMultipliers[i],
          nonce // Pass nonce explicitly
        );
        
        if (result.success) {
          return result;
        }
        
        // Check for nonce-related errors and reset cache - use rawError for full object
        // Non-RPC errors (reverted, timeout) never have rawError and are never nonce-related
        if (result.rawError) {
          nonceManager.handleNonceError(result.rawError);
        }
        
        // Don't retry if it's a permanent failure
        if (!result.shouldRetry) {
          return result;
        }
        
        // Brief wait before retry
        if (i < gasMultipliers.length - 1) {
          console.log(`Retrying with higher gas (attempt ${i + 2}/${gasMultipliers.length})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return {
        success: false,
        error: 'Transaction failed after multiple retry attempts. The network may be congested.',
      };
    } catch (error: any) {
      console.error('ERC-20 transfer failed:', error);
      
      // Check for nonce-related errors
      nonceManager.handleNonceError(error);
      
      let errorMessage = 'Transaction failed';
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient gas funds in paymaster wallet';
      } else if (error.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed - check token balance and allowance';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  });
}

export async function estimateTransferGas(
  tokenContract: string,
  toAddress: string,
  amount: string
): Promise<string | null> {
  const privateKey = getPaymasterPrivateKey();
  
  if (!privateKey) {
    return null;
  }

  try {
    // Use raw RPC call for Kasplex compatibility
    const wallet = new ethers.Wallet(privateKey);
    const iface = new ethers.Interface(ERC20_ABI);
    const data = iface.encodeFunctionData('transfer', [toAddress, BigInt(amount)]);
    
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [{
          from: wallet.address,
          to: tokenContract,
          data: data,
        }],
        id: 1,
      }),
    });
    
    const result = await response.json();
    if (result.result) {
      return BigInt(result.result).toString();
    }
    // Default to 100000 if estimation fails
    return '100000';
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return '100000'; // Default gas limit
  }
}

export async function getNativeBalance(walletAddress: string): Promise<string | null> {
  try {
    // Use raw RPC call for Kasplex compatibility
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
        id: 1,
      }),
    });
    
    const data = await response.json();
    if (data.result) {
      return BigInt(data.result).toString();
    }
    return null;
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return null;
  }
}

export interface TokenBalance {
  balance: string;
  formattedBalance: string;
  decimals: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

async function ethCall(to: string, data: string): Promise<string | null> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      console.error(`Kasplex EVM RPC error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (result.error) {
      console.error('EVM call error:', result.error);
      return null;
    }

    return result.result;
  } catch (error) {
    console.error('Error making EVM call:', error);
    return null;
  }
}

function padAddress(address: string): string {
  const cleanAddress = address.toLowerCase().replace('0x', '');
  return cleanAddress.padStart(64, '0');
}

function hexToDecimal(hex: string): string {
  if (!hex || hex === '0x') return '0';
  return BigInt(hex).toString();
}

function hexToNumber(hex: string): number {
  if (!hex || hex === '0x') return 0;
  return Number(BigInt(hex));
}

function decodeString(hex: string): string {
  if (!hex || hex === '0x' || hex.length < 130) return '';
  try {
    const offsetHex = hex.slice(2, 66);
    const lengthHex = hex.slice(66, 130);
    const length = Number(BigInt('0x' + lengthHex));
    const dataHex = hex.slice(130, 130 + length * 2);
    const bytes = Buffer.from(dataHex, 'hex');
    return bytes.toString('utf8');
  } catch {
    return '';
  }
}

export async function getERC20Balance(
  tokenContract: string,
  walletAddress: string
): Promise<TokenBalance | null> {
  try {
    const balanceData = ERC20_BALANCE_OF_ABI + padAddress(walletAddress);
    const [balanceResult, decimalsResult] = await Promise.all([
      ethCall(tokenContract, balanceData),
      ethCall(tokenContract, ERC20_DECIMALS_ABI),
    ]);

    if (!balanceResult) {
      return null;
    }

    const balance = hexToDecimal(balanceResult);
    const decimals = decimalsResult ? hexToNumber(decimalsResult) : 18;

    return {
      balance,
      formattedBalance: formatTokenAmount(balance, decimals),
      decimals,
    };
  } catch (error) {
    console.error('Error fetching ERC20 balance:', error);
    return null;
  }
}

export async function getERC20TokenInfo(
  tokenContract: string
): Promise<TokenInfo | null> {
  try {
    const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.all([
      ethCall(tokenContract, ERC20_NAME_ABI),
      ethCall(tokenContract, ERC20_SYMBOL_ABI),
      ethCall(tokenContract, ERC20_DECIMALS_ABI),
      ethCall(tokenContract, ERC20_TOTAL_SUPPLY_ABI),
    ]);

    if (!symbolResult) {
      return null;
    }

    return {
      name: nameResult ? decodeString(nameResult) : '',
      symbol: symbolResult ? decodeString(symbolResult) : '',
      decimals: decimalsResult ? hexToNumber(decimalsResult) : 18,
      totalSupply: totalSupplyResult ? hexToDecimal(totalSupplyResult) : '0',
    };
  } catch (error) {
    console.error('Error fetching ERC20 token info:', error);
    return null;
  }
}

export async function getEthBalance(walletAddress: string): Promise<string | null> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.error) {
      return null;
    }

    return hexToDecimal(result.result);
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    return null;
  }
}

export async function getBlockNumber(): Promise<number | null> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.error) {
      return null;
    }

    return hexToNumber(result.result);
  } catch (error) {
    console.error('Error fetching block number:', error);
    return null;
  }
}

export async function getTransactionReceipt(txHash: string): Promise<any | null> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.result || null;
  } catch (error) {
    console.error('Error fetching transaction receipt:', error);
    return null;
  }
}

// Kaspacom DEX API for live token data
const KASPACOM_DEX_API = 'https://api-defi.kaspa.com';

export interface KaspacomTokenData {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  totalSupply: string;
  tokenPriceUSD: number;
  marketCapUSD: number;
  holders: number;
  volume24h?: number;
  priceChange24h?: number;
}

export async function getKaspacomTokenData(tokenAddress: string): Promise<KaspacomTokenData | null> {
  try {
    const response = await fetch(`${KASPACOM_DEX_API}/dex/token/${tokenAddress}/detailed`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`Kaspacom API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      totalSupply: data.totalSupply,
      tokenPriceUSD: data.tokenPriceUSD || 0,
      marketCapUSD: data.marketCapUSD || 0,
      holders: data.holders || 0,
      volume24h: data.volume24h,
      priceChange24h: data.priceChange24h,
    };
  } catch (error) {
    console.error('Error fetching Kaspacom token data:', error);
    return null;
  }
}

export async function getKaspacomTokenBasic(tokenAddress: string): Promise<{ symbol: string; name: string; logo?: string } | null> {
  try {
    const response = await fetch(`${KASPACOM_DEX_API}/dex/token/${tokenAddress}/logo`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Kaspacom token basic data:', error);
    return null;
  }
}

export function formatTokenAmount(amount: string, decimals: number): string {
  try {
    const amountNum = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const integerPart = amountNum / divisor;
    const fractionalPart = amountNum % divisor;

    if (fractionalPart === BigInt(0)) {
      return integerPart.toLocaleString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${integerPart.toLocaleString()}.${fractionalStr}`;
  } catch {
    return '0';
  }
}

export function parseTokenAmount(amount: string, decimals: number): string {
  try {
    const parts = amount.split('.');
    const integerPart = parts[0].replace(/,/g, '');
    const fractionalPart = parts[1] || '';

    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    const fullAmount = integerPart + paddedFractional;

    const parsed = BigInt(fullAmount);
    return parsed.toString();
  } catch {
    return '0';
  }
}

// ============ POST-PAYOUT TRACKING: Get outbound transfers from a wallet ============
export interface TokenTransfer {
  txHash: string;
  from: string;
  to: string;
  amount: string; // Raw amount (with decimals)
  blockNumber: number;
  timestamp?: number;
}

// ERC20 Transfer event signature: Transfer(address,address,uint256)
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export async function getOutboundTransfers(
  walletAddress: string, 
  tokenAddress: string,
  fromBlock: string = 'earliest',
  toBlock: string = 'latest'
): Promise<TokenTransfer[]> {
  try {
    const normalizedWallet = walletAddress.toLowerCase();
    // Pad wallet address to 32 bytes for topic matching
    const paddedWallet = '0x' + normalizedWallet.slice(2).padStart(64, '0');
    
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [{
          address: tokenAddress,
          topics: [
            TRANSFER_EVENT_SIGNATURE,
            paddedWallet, // from address (topic1)
            null // to address (topic2) - any destination
          ],
          fromBlock,
          toBlock
        }]
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('RPC error fetching transfers:', data.error);
      return [];
    }
    
    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }
    
    return data.result.map((log: any) => ({
      txHash: log.transactionHash,
      from: '0x' + log.topics[1].slice(26), // Extract address from 32-byte topic
      to: '0x' + log.topics[2].slice(26),
      amount: log.data, // Raw hex amount
      blockNumber: parseInt(log.blockNumber, 16),
    }));
  } catch (error) {
    console.error('Error fetching outbound transfers:', error);
    return [];
  }
}

// Get transfers that occurred after a specific block
export async function getTransfersAfterBlock(
  walletAddress: string,
  afterBlock: number,
  tokenAddress: string
): Promise<TokenTransfer[]> {
  return getOutboundTransfers(
    walletAddress, 
    tokenAddress, 
    '0x' + afterBlock.toString(16),
    'latest'
  );
}

// Helper to check current block number
export async function getCurrentBlockNumber(): Promise<number> {
  try {
    const response = await fetch(KASPLEX_EVM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      }),
    });
    
    const data = await response.json();
    return parseInt(data.result, 16);
  } catch (error) {
    console.error('Error getting block number:', error);
    return 0;
  }
}

// ============ PAYMASTER SECURITY MODULE ============
// Implements per-transaction caps, audit logging, circuit breaker, and low balance alerts

// Security configuration
const PAYMASTER_SECURITY = {
  MAX_SINGLE_PAYOUT_BMT: 50000, // Max 50,000 BMT per single transaction
  CIRCUIT_BREAKER_THRESHOLD: 20, // Trip if 20+ payouts in 1 minute
  LOW_BALANCE_ALERT_BMT: 100000, // Alert when treasury drops below 100k BMT
  CRITICAL_BALANCE_BMT: 10000, // Critical alert below 10k BMT
};

// Log a paymaster operation
export async function logPaymasterOperation(
  operation: string,
  status: 'success' | 'failed' | 'blocked' | 'pending',
  details: {
    toAddress?: string;
    amount?: string;
    amountFormatted?: string;
    txHash?: string;
    errorMessage?: string;
    rewardId?: string;
    userId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await db.insert(paymasterAuditLog).values({
      operation,
      status,
      toAddress: details.toAddress,
      amount: details.amount,
      amountFormatted: details.amountFormatted,
      txHash: details.txHash,
      errorMessage: details.errorMessage,
      rewardId: details.rewardId,
      userId: details.userId,
      ipAddress: details.ipAddress,
      metadata: details.metadata,
    });
  } catch (error) {
    console.error('[Paymaster Audit] Failed to log operation:', error);
  }
}

// Check if circuit breaker is tripped
export async function isCircuitBreakerTripped(): Promise<{ tripped: boolean; reason?: string }> {
  try {
    const [state] = await db.select().from(paymasterCircuitBreaker).limit(1);
    
    if (state?.isTripped) {
      return { tripped: true, reason: state.tripReason || 'Circuit breaker is active' };
    }
    
    // Check burst activity (payouts in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentPayouts = await db.select()
      .from(paymasterAuditLog)
      .where(gte(paymasterAuditLog.createdAt, oneMinuteAgo));
    
    const successfulPayouts = recentPayouts.filter(p => 
      p.operation === 'transfer' && p.status === 'success'
    );
    
    if (successfulPayouts.length >= PAYMASTER_SECURITY.CIRCUIT_BREAKER_THRESHOLD) {
      // Auto-trip the circuit breaker
      await tripCircuitBreaker('auto', `Burst activity detected: ${successfulPayouts.length} payouts in last minute`);
      return { tripped: true, reason: 'Automatic circuit breaker: unusual payout velocity' };
    }
    
    return { tripped: false };
  } catch (error) {
    console.error('[Paymaster] Circuit breaker check failed:', error);
    return { tripped: false }; // Fail open to not block legitimate payouts
  }
}

// Trip the circuit breaker
export async function tripCircuitBreaker(by: 'auto' | 'admin' | 'low_balance', reason: string): Promise<void> {
  console.log(`[Paymaster] CIRCUIT BREAKER TRIPPED by ${by}: ${reason}`);
  
  try {
    const existing = await db.select().from(paymasterCircuitBreaker).limit(1);
    
    if (existing.length === 0) {
      await db.insert(paymasterCircuitBreaker).values({
        isTripped: true,
        tripReason: reason,
        trippedAt: new Date(),
        trippedBy: by,
        updatedAt: new Date(),
      });
    } else {
      await db.update(paymasterCircuitBreaker)
        .set({
          isTripped: true,
          tripReason: reason,
          trippedAt: new Date(),
          trippedBy: by,
          updatedAt: new Date(),
        });
    }
    
    await logPaymasterOperation('circuit_breaker_trip', 'success', {
      metadata: { reason, trippedBy: by }
    });
  } catch (error) {
    console.error('[Paymaster] Failed to trip circuit breaker:', error);
  }
}

// Reset the circuit breaker (admin only)
export async function resetCircuitBreaker(): Promise<void> {
  console.log('[Paymaster] Circuit breaker RESET');
  
  try {
    await db.update(paymasterCircuitBreaker)
      .set({
        isTripped: false,
        tripReason: null,
        resetAt: new Date(),
        updatedAt: new Date(),
      });
    
    await logPaymasterOperation('circuit_breaker_reset', 'success', {});
  } catch (error) {
    console.error('[Paymaster] Failed to reset circuit breaker:', error);
  }
}

// Validate payout before processing
export async function validatePayout(
  amountBmt: number,
  toAddress: string,
  rewardId?: string,
  userId?: string,
  ipAddress?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check per-transaction cap
  if (amountBmt > PAYMASTER_SECURITY.MAX_SINGLE_PAYOUT_BMT) {
    await logPaymasterOperation('transfer', 'blocked', {
      toAddress,
      amountFormatted: `${amountBmt} BMT`,
      rewardId,
      userId,
      ipAddress,
      errorMessage: `Exceeds max single payout: ${amountBmt} > ${PAYMASTER_SECURITY.MAX_SINGLE_PAYOUT_BMT}`,
    });
    return { 
      allowed: false, 
      reason: `Payout exceeds maximum single transaction limit of ${PAYMASTER_SECURITY.MAX_SINGLE_PAYOUT_BMT} BMT` 
    };
  }
  
  // Check circuit breaker
  const circuitBreaker = await isCircuitBreakerTripped();
  if (circuitBreaker.tripped) {
    await logPaymasterOperation('transfer', 'blocked', {
      toAddress,
      amountFormatted: `${amountBmt} BMT`,
      rewardId,
      userId,
      ipAddress,
      errorMessage: `Circuit breaker: ${circuitBreaker.reason}`,
    });
    return { allowed: false, reason: circuitBreaker.reason };
  }
  
  return { allowed: true };
}

// Check treasury balance and alert if low
export async function checkTreasuryBalance(): Promise<{
  balance: string;
  balanceBmt: number;
  status: 'healthy' | 'low' | 'critical';
}> {
  try {
    const BMT_CONTRACT = process.env.BMT_TOKEN_CONTRACT || '0x38e29a858977a5cF82E2bf28f6302C7775700D94';
    const paymasterAddress = getPaymasterWalletAddress();
    
    if (!paymasterAddress) {
      return { balance: '0', balanceBmt: 0, status: 'critical' };
    }
    
    const balanceResult = await getERC20Balance(paymasterAddress, BMT_CONTRACT);
    const balanceStr = balanceResult?.balance || '0';
    const balanceBmt = parseFloat(balanceStr) / 1e18;
    
    let status: 'healthy' | 'low' | 'critical' = 'healthy';
    
    if (balanceBmt < PAYMASTER_SECURITY.CRITICAL_BALANCE_BMT) {
      status = 'critical';
      console.log(`[Paymaster] CRITICAL: Treasury balance is ${balanceBmt} BMT`);
      await tripCircuitBreaker('low_balance', `Critical balance: ${balanceBmt} BMT`);
    } else if (balanceBmt < PAYMASTER_SECURITY.LOW_BALANCE_ALERT_BMT) {
      status = 'low';
      console.log(`[Paymaster] WARNING: Treasury balance is low: ${balanceBmt} BMT`);
    }
    
    // Update circuit breaker state with balance info
    try {
      const existing = await db.select().from(paymasterCircuitBreaker).limit(1);
      if (existing.length === 0) {
        await db.insert(paymasterCircuitBreaker).values({
          lastBalanceCheck: balanceStr,
          lastBalanceCheckAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await db.update(paymasterCircuitBreaker).set({
          lastBalanceCheck: balanceStr,
          lastBalanceCheckAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (e) {
      // Ignore update errors
    }
    
    return { balance: balanceStr, balanceBmt, status };
  } catch (error) {
    console.error('[Paymaster] Balance check failed:', error);
    return { balance: '0', balanceBmt: 0, status: 'critical' };
  }
}

// Get paymaster security stats for admin dashboard
export async function getPaymasterSecurityStats(): Promise<{
  circuitBreakerTripped: boolean;
  tripReason?: string;
  payoutsLastMinute: number;
  payoutsLastHour: number;
  payoutsLast24Hours: number;
  totalPayoutsBmt24Hours: number;
  treasuryBalance: number;
  treasuryStatus: 'healthy' | 'low' | 'critical';
  recentOperations: typeof paymasterAuditLog.$inferSelect[];
}> {
  try {
    const circuitBreaker = await isCircuitBreakerTripped();
    const treasury = await checkTreasuryBalance();
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentOps = await db.select()
      .from(paymasterAuditLog)
      .where(gte(paymasterAuditLog.createdAt, oneDayAgo))
      .orderBy(desc(paymasterAuditLog.createdAt))
      .limit(100);
    
    const successfulTransfers = recentOps.filter(op => 
      op.operation === 'transfer' && op.status === 'success'
    );
    
    const payoutsLastMinute = successfulTransfers.filter(op => 
      new Date(op.createdAt!) >= oneMinuteAgo
    ).length;
    
    const payoutsLastHour = successfulTransfers.filter(op => 
      new Date(op.createdAt!) >= oneHourAgo
    ).length;
    
    const totalPayoutsBmt24Hours = successfulTransfers.reduce((sum, op) => {
      if (op.amountFormatted) {
        const match = op.amountFormatted.match(/[\d.]+/);
        return sum + (match ? parseFloat(match[0]) : 0);
      }
      return sum;
    }, 0);
    
    return {
      circuitBreakerTripped: circuitBreaker.tripped,
      tripReason: circuitBreaker.reason,
      payoutsLastMinute,
      payoutsLastHour,
      payoutsLast24Hours: successfulTransfers.length,
      totalPayoutsBmt24Hours: Math.round(totalPayoutsBmt24Hours),
      treasuryBalance: treasury.balanceBmt,
      treasuryStatus: treasury.status,
      recentOperations: recentOps.slice(0, 20),
    };
  } catch (error) {
    console.error('[Paymaster] Failed to get stats:', error);
    return {
      circuitBreakerTripped: false,
      payoutsLastMinute: 0,
      payoutsLastHour: 0,
      payoutsLast24Hours: 0,
      totalPayoutsBmt24Hours: 0,
      treasuryBalance: 0,
      treasuryStatus: 'critical',
      recentOperations: [],
    };
  }
}

// Export security config for admin visibility
export function getPaymasterSecurityConfig() {
  return PAYMASTER_SECURITY;
}

export { KASPLEX_EVM_RPC, KASPLEX_CHAIN_ID };
