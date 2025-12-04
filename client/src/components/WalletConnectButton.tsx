import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/auth';
import type { User } from '@shared/schema';

interface EthereumProvider {
  isMetaMask?: boolean;
  isKasware?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  providers?: EthereumProvider[];
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    kasware?: {
      ethereum?: EthereumProvider;
      requestAccounts?: () => Promise<string[]>;
      getAccounts?: () => Promise<string[]>;
      signMessage?: (message: string) => Promise<string>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// Get the actual MetaMask provider, handling multi-wallet scenarios
function getMetaMaskProvider(): EthereumProvider | null {
  if (!window.ethereum) {
    console.log('[Wallet] No window.ethereum found');
    return null;
  }
  
  // Debug: log what we're working with
  console.log('[Wallet] Detecting MetaMask...', {
    hasProviders: !!window.ethereum.providers?.length,
    isMetaMask: window.ethereum.isMetaMask,
    isKasware: window.ethereum.isKasware,
    hasKaswareWindow: !!window.kasware
  });
  
  // If there's a providers array (multi-wallet), find MetaMask specifically
  if (window.ethereum.providers?.length) {
    const metamask = window.ethereum.providers.find(p => p.isMetaMask && !p.isKasware);
    if (metamask) {
      console.log('[Wallet] Found MetaMask in providers array');
      return metamask;
    }
  }
  
  // If Kasware has its own window object, avoid window.ethereum (Kasware may have hijacked it)
  // and only return window.ethereum if it explicitly says it's MetaMask
  if (window.kasware) {
    // Kasware is installed - be careful with window.ethereum
    if (window.ethereum.isMetaMask && !window.ethereum.isKasware) {
      console.log('[Wallet] Using window.ethereum (marked as MetaMask, Kasware also present)');
      return window.ethereum;
    }
    console.log('[Wallet] Kasware present but MetaMask not clearly identified');
    return null;
  }
  
  // No Kasware installed - safe to use window.ethereum if it exists
  if (window.ethereum.isMetaMask) {
    console.log('[Wallet] Using window.ethereum (isMetaMask flag set)');
    return window.ethereum;
  }
  
  // Last resort: use window.ethereum even without isMetaMask flag
  // Some wallet configurations don't set this properly
  console.log('[Wallet] Fallback: using window.ethereum without isMetaMask flag');
  return window.ethereum;
}

// Get the Kasware provider - prefer window.kasware.ethereum
function getKaswareProvider(): EthereumProvider | null {
  // Prefer the dedicated Kasware ethereum provider
  if (window.kasware?.ethereum) {
    console.log('[Wallet] Using window.kasware.ethereum');
    return window.kasware.ethereum;
  }
  
  // Fallback: check providers array
  if (window.ethereum?.providers?.length) {
    const kasware = window.ethereum.providers.find(p => p.isKasware);
    if (kasware) {
      console.log('[Wallet] Found Kasware in providers array');
      return kasware;
    }
  }
  
  // Last resort: main ethereum if it's Kasware
  if (window.ethereum?.isKasware) {
    console.log('[Wallet] Using window.ethereum (isKasware flag set)');
    return window.ethereum;
  }
  
  return null;
}

interface WalletConnectButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

type WalletType = 'metamask' | 'kasware';

export default function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null);
  const [availableWallets, setAvailableWallets] = useState<{ type: WalletType; name: string; available: boolean }[]>([]);
  const { toast } = useToast();

  // Detect wallets - call this multiple times as extensions may load late
  const refreshWalletDetection = () => {
    const wallets: { type: WalletType; name: string; available: boolean }[] = [
      { type: 'metamask', name: 'MetaMask', available: !!getMetaMaskProvider() },
      { type: 'kasware', name: 'Kasware', available: !!(getKaswareProvider() || window.kasware?.requestAccounts) },
    ];
    setAvailableWallets(wallets);
    console.log('[Wallet] Detection refresh:', wallets.map(w => `${w.name}: ${w.available}`).join(', '));
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchCurrentUser();
    }
    
    // Initial detection
    refreshWalletDetection();
    
    // Re-detect after delays (wallet extensions load asynchronously)
    const timer1 = setTimeout(refreshWalletDetection, 500);
    const timer2 = setTimeout(refreshWalletDetection, 1500);
    const timer3 = setTimeout(refreshWalletDetection, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const user: User = await res.json();
        if (user.walletAddress) {
          setFullAddress(user.walletAddress);
          setIsConnected(true);
        }
      } else {
        clearAuthToken();
      }
    } catch {
      clearAuthToken();
    }
  };

  const formatAddress = (addr: string): string => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayAddress = formatAddress(fullAddress);
  
  // When opening the wallet selector, refresh detection
  const openWalletSelector = () => {
    refreshWalletDetection();
    setShowWalletSelector(true);
  };

  const connectMetaMask = async (): Promise<{ address: string; signature: string }> => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask is not installed or not detected. If you have multiple wallets, please ensure MetaMask is enabled.');
    }

    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    
    const nonceRes = await fetch('/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });

    if (!nonceRes.ok) {
      throw new Error('Failed to get authentication nonce');
    }

    const { message } = await nonceRes.json();
    
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string;

    return { address, signature };
  };

  const connectKasware = async (): Promise<{ address: string; signature: string }> => {
    if (!window.kasware) {
      throw new Error('Kasware wallet is not installed');
    }

    let address: string;
    let signature: string;

    if (window.kasware.ethereum) {
      const accounts = await window.kasware.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      address = accounts[0];
      
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication nonce');
      }

      const { message } = await nonceRes.json();
      
      signature = await window.kasware.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      }) as string;
    } else if (window.kasware.requestAccounts && window.kasware.signMessage) {
      const accounts = await window.kasware.requestAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      address = accounts[0];
      
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication nonce');
      }

      const { message } = await nonceRes.json();
      
      signature = await window.kasware.signMessage(message);
    } else {
      throw new Error('Kasware wallet API not available');
    }

    return { address, signature };
  };

  const handleWalletConnect = async (walletType: WalletType) => {
    setConnectingWallet(walletType);
    setIsLoading(true);
    
    try {
      let walletAddress: string;
      let signature: string;

      if (walletType === 'metamask') {
        const result = await connectMetaMask();
        walletAddress = result.address;
        signature = result.signature;
      } else if (walletType === 'kasware') {
        const result = await connectKasware();
        walletAddress = result.address;
        signature = result.signature;
      } else {
        throw new Error('Unknown wallet type');
      }
      
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature }),
      });
      
      if (!verifyRes.ok) {
        throw new Error('Failed to verify wallet signature');
      }
      
      const { token } = await verifyRes.json();
      
      setAuthToken(token);
      setFullAddress(walletAddress);
      setIsConnected(true);
      setShowWalletSelector(false);
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      
      toast({
        title: 'Wallet Connected',
        description: 'You can now enroll in courses and earn $BMT rewards.',
      });
      
      onConnect?.();
    } catch (error) {
      console.error('Wallet connect error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setConnectingWallet(null);
    }
  };

  const handleDemoConnect = async () => {
    setIsLoading(true);
    
    try {
      const walletAddress = `0x${generateMockAddress()}`;
      
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      
      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication nonce');
      }
      
      const { nonce } = await nonceRes.json();
      
      const signature = `0xdemo_${nonce.slice(0, 32)}`;
      
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature }),
      });
      
      if (!verifyRes.ok) {
        throw new Error('Failed to verify wallet');
      }
      
      const { token } = await verifyRes.json();
      
      setAuthToken(token);
      setFullAddress(walletAddress);
      setIsConnected(true);
      setShowWalletSelector(false);
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      
      toast({
        title: 'Demo Wallet Connected',
        description: 'Using demo mode. Connect a real wallet for full functionality.',
      });
      
      onConnect?.();
    } catch (error) {
      console.error('Demo connect error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect demo wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
    } finally {
      clearAuthToken();
      setIsConnected(false);
      setFullAddress('');
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      
      toast({
        title: 'Wallet Disconnected',
        description: 'You have been logged out.',
      });
      
      onDisconnect?.();
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard.',
    });
  };

  if (!isConnected) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            onClick={openWalletSelector}
            disabled={isLoading}
            className="bg-transparent border border-kaspa-cyan text-kaspa-cyan hover:bg-kaspa-cyan/10 font-heading uppercase tracking-wide gap-2"
            data-testid="button-connect-wallet"
          >
            {isLoading && connectingWallet ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            {isLoading && connectingWallet ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          
          <Button
            onClick={handleDemoConnect}
            disabled={isLoading}
            variant="outline"
            className="border-bmt-orange/50 text-bmt-orange hover:bg-bmt-orange/10 font-heading uppercase tracking-wide gap-2"
            data-testid="button-demo-mode"
          >
            {isLoading && !connectingWallet ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Demo Mode
          </Button>
        </div>

        <Dialog open={showWalletSelector} onOpenChange={setShowWalletSelector}>
          <DialogContent className="sm:max-w-md" data-testid="modal-wallet-selector">
            <DialogHeader>
              <DialogTitle className="text-center font-heading">Connect Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Connect your EVM-compatible wallet to access BMT University
              </p>
              
              {availableWallets.map((wallet) => (
                <Button
                  key={wallet.type}
                  variant="outline"
                  className="w-full justify-between h-14 px-4"
                  disabled={!wallet.available || isLoading}
                  onClick={() => handleWalletConnect(wallet.type)}
                  data-testid={`button-connect-${wallet.type}`}
                >
                  <span className="flex items-center gap-3">
                    {wallet.type === 'metamask' && (
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-8 h-8" />
                    )}
                    {wallet.type === 'kasware' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kaspa-cyan to-kaspa-green flex items-center justify-center text-background font-bold text-sm">
                        K
                      </div>
                    )}
                    <span className="font-medium">{wallet.name}</span>
                  </span>
                  {wallet.available ? (
                    connectingWallet === wallet.type ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-kaspa-green">Detected</span>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">Not Installed</span>
                  )}
                </Button>
              ))}

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleDemoConnect}
                disabled={isLoading}
                data-testid="button-demo-connect"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Continue with Demo Wallet
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Demo mode uses a simulated wallet for testing
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-kaspa-cyan/50 text-kaspa-cyan bg-kaspa-cyan/10 gap-2"
          data-testid="button-wallet-menu"
        >
          <div className="w-2 h-2 rounded-full bg-kaspa-green animate-pulse" />
          {displayAddress}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyAddress} data-testid="menu-item-copy-address">
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="menu-item-view-explorer">
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive" data-testid="menu-item-disconnect">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function generateMockAddress(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
