const AUTH_TOKEN_KEY = 'bmt_auth_token';
const WALLET_ADDRESS_KEY = 'bmt_wallet_address';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(WALLET_ADDRESS_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getWalletAddress(): string | null {
  return localStorage.getItem(WALLET_ADDRESS_KEY);
}

export function setWalletAddress(address: string): void {
  localStorage.setItem(WALLET_ADDRESS_KEY, address);
}
