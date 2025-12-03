const KASPLEX_API_BASE = 'https://api.kasplex.org/v1';

export interface KRC20Balance {
  tick: string;
  balance: string;
  locked: string;
  dec: number;
}

export interface KRC20TokenInfo {
  tick: string;
  max: string;
  lim: string;
  pre: string;
  to: string;
  dec: number;
  minted: string;
  opScoreAdd: string;
  opScoreMod: string;
  state: string;
  hashRev: string;
  mtsAdd: string;
}

export interface KasplexResponse<T> {
  message: string;
  result: T;
}

export async function getKRC20Balance(address: string, ticker: string): Promise<KRC20Balance | null> {
  try {
    const normalizedTicker = ticker.toUpperCase();
    const response = await fetch(
      `${KASPLEX_API_BASE}/krc20/address/${address}/token/${normalizedTicker}`
    );
    
    if (!response.ok) {
      console.error(`Kasplex API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data: KasplexResponse<KRC20Balance[]> = await response.json();
    
    if (data.message !== 'successful' || !data.result || data.result.length === 0) {
      return null;
    }
    
    return data.result[0];
  } catch (error) {
    console.error('Error fetching KRC20 balance:', error);
    return null;
  }
}

export async function getKRC20TokenInfo(ticker: string): Promise<KRC20TokenInfo | null> {
  try {
    const normalizedTicker = ticker.toUpperCase();
    const response = await fetch(
      `${KASPLEX_API_BASE}/krc20/token/${normalizedTicker}`
    );
    
    if (!response.ok) {
      console.error(`Kasplex API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data: KasplexResponse<KRC20TokenInfo[]> = await response.json();
    
    if (data.message !== 'successful' || !data.result || data.result.length === 0) {
      return null;
    }
    
    return data.result[0];
  } catch (error) {
    console.error('Error fetching KRC20 token info:', error);
    return null;
  }
}

export async function getAllKRC20Balances(address: string): Promise<KRC20Balance[]> {
  try {
    const response = await fetch(
      `${KASPLEX_API_BASE}/krc20/address/${address}/tokenlist`
    );
    
    if (!response.ok) {
      console.error(`Kasplex API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: KasplexResponse<KRC20Balance[]> = await response.json();
    
    if (data.message !== 'successful' || !data.result) {
      return [];
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching all KRC20 balances:', error);
    return [];
  }
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const amountNum = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = amountNum / divisor;
  const fractionalPart = amountNum % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return integerPart.toLocaleString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${integerPart.toLocaleString()}.${fractionalStr}`;
}

export function parseTokenAmount(amount: string, decimals: number): string {
  const parts = amount.split('.');
  const integerPart = parts[0].replace(/,/g, '');
  const fractionalPart = parts[1] || '';
  
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullAmount = integerPart + paddedFractional;
  
  return BigInt(fullAmount).toString();
}
