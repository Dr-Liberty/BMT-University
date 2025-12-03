const KASPLEX_EVM_RPC = 'https://evmrpc.kasplex.org';
const KASPLEX_CHAIN_ID = 202555;

const ERC20_BALANCE_OF_ABI = '0x70a08231';
const ERC20_DECIMALS_ABI = '0x313ce567';
const ERC20_SYMBOL_ABI = '0x95d89b41';
const ERC20_NAME_ABI = '0x06fdde03';
const ERC20_TOTAL_SUPPLY_ABI = '0x18160ddd';

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
