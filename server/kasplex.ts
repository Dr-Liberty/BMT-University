import { ethers } from 'ethers';

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
async function getRawNonce(walletAddress: string, usePending: boolean = true): Promise<number> {
  try {
    // Try 'pending' first to include unconfirmed transactions
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
    
    console.warn('Could not get nonce from RPC, defaulting to 0');
    return 0;
  } catch (error) {
    console.error('Failed to get nonce:', error);
    // Fallback to 'latest' on error
    if (usePending) {
      return getRawNonce(walletAddress, false);
    }
    return 0;
  }
}

// Broadcast-only transfer result (no confirmation wait)
export interface BroadcastResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Submit transaction without waiting for confirmation (fast, for async flows)
export async function submitTransferERC20(
  tokenContract: string,
  toAddress: string,
  amount: string,
  decimals: number = 18
): Promise<BroadcastResult> {
  const privateKey = getPaymasterPrivateKey();
  
  if (!privateKey) {
    return { success: false, error: 'Paymaster private key not configured' };
  }

  try {
    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = wallet.address;
    const amountBigInt = BigInt(amount);
    
    console.log(`[FastSubmit] Initiating ERC-20 transfer:`);
    console.log(`  Token: ${tokenContract}`);
    console.log(`  To: ${toAddress}`);
    console.log(`  Amount: ${formatTokenAmount(amount, decimals)} (${amount} wei)`);
    console.log(`  From: ${walletAddress}`);
    
    // Get nonce using raw RPC call
    const nonce = await getRawNonce(walletAddress);
    
    // Get current network gas price with 5x multiplier for reliable confirmation
    // Base is ~2000 gwei, so 5x = ~10000 gwei * 100k gas = ~1 KAS per tx
    // Ensure paymaster wallet has sufficient KAS for gas
    const networkGasPrice = await getNetworkGasPrice();
    const gasPrice = networkGasPrice * 5n; // 5x multiplier for reliability
    console.log(`  Gas price: ${Number(gasPrice) / 1e9} gwei, nonce: ${nonce}`);
    
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
      console.error('[FastSubmit] RPC error:', sendData.error);
      return { success: false, error: sendData.error.message || 'Transaction rejected' };
    }
    
    const txHash = sendData.result;
    console.log(`[FastSubmit] Transaction broadcast: ${txHash}`);
    
    return { success: true, txHash };
  } catch (error: any) {
    console.error('[FastSubmit] Error:', error);
    return { success: false, error: error.message || 'Broadcast failed' };
  }
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
async function attemptTransfer(
  wallet: ethers.Wallet,
  tokenContract: string,
  toAddress: string,
  amount: string,
  decimals: number,
  gasMultiplier: bigint,
  nonceOverride?: number
): Promise<TransferResult & { shouldRetry?: boolean }> {
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
    // Check if we should retry with higher gas
    const shouldRetry = errorMsg.includes('underpriced') || 
                        errorMsg.includes('gas') ||
                        errorMsg.includes('nonce') ||
                        errorMsg.includes('replacement');
    return {
      success: false,
      error: sendData.error.message || 'Transaction rejected by network',
      shouldRetry,
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

  try {
    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = wallet.address;
    
    console.log(`Initiating ERC-20 transfer:`);
    console.log(`  Token: ${tokenContract}`);
    console.log(`  To: ${toAddress}`);
    console.log(`  Amount: ${formatTokenAmount(amount, decimals)} (${amount} wei)`);
    console.log(`  From: ${walletAddress}`);
    
    // Progressive gas multipliers for retries (Kasplex RPC can be finicky)
    // Limited to 3 attempts to fit within browser timeout (~45s total)
    const gasMultipliers = [3n, 6n, 10n];
    
    for (let i = 0; i < gasMultipliers.length; i++) {
      const result = await attemptTransfer(
        wallet,
        tokenContract,
        toAddress,
        amount,
        decimals,
        gasMultipliers[i]
      );
      
      if (result.success) {
        return result;
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

export { KASPLEX_EVM_RPC, KASPLEX_CHAIN_ID };
