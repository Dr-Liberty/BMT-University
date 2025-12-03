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
    const rpcProvider = getProvider();
    const wallet = new ethers.Wallet(privateKey, rpcProvider);
    
    const contract = new ethers.Contract(tokenContract, ERC20_ABI, wallet);
    
    const amountBigInt = BigInt(amount);
    
    console.log(`Initiating ERC-20 transfer:`);
    console.log(`  Token: ${tokenContract}`);
    console.log(`  To: ${toAddress}`);
    console.log(`  Amount: ${formatTokenAmount(amount, decimals)} (${amount} wei)`);
    console.log(`  From: ${wallet.address}`);
    
    const tx = await contract.transfer(toAddress, amountBigInt);
    console.log(`Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    return {
      success: true,
      txHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber,
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
    const rpcProvider = getProvider();
    const wallet = new ethers.Wallet(privateKey, rpcProvider);
    const contract = new ethers.Contract(tokenContract, ERC20_ABI, wallet);
    
    const gasEstimate = await contract.transfer.estimateGas(toAddress, BigInt(amount));
    return gasEstimate.toString();
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return null;
  }
}

export async function getNativeBalance(walletAddress: string): Promise<string | null> {
  try {
    const rpcProvider = getProvider();
    const balance = await rpcProvider.getBalance(walletAddress);
    return balance.toString();
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
