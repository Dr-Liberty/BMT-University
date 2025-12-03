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

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
    kasware?: {
      ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        isKasware?: boolean;
      };
      requestAccounts?: () => Promise<string[]>;
      getAccounts?: () => Promise<string[]>;
      signMessage?: (message: string) => Promise<string>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
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
  const { toast } = useToast();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchCurrentUser();
    }
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

  const detectAvailableWallets = () => {
    const wallets: { type: WalletType; name: string; available: boolean }[] = [
      { type: 'metamask', name: 'MetaMask', available: !!window.ethereum?.isMetaMask },
      { type: 'kasware', name: 'Kasware', available: !!(window.kasware?.ethereum || window.kasware?.requestAccounts) },
    ];
    return wallets;
  };

  const connectMetaMask = async (): Promise<{ address: string; signature: string }> => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const accounts = await window.ethereum.request({
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
    
    const signature = await window.ethereum.request({
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

  const wallets = detectAvailableWallets();

  if (!isConnected) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowWalletSelector(true)}
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
              
              {wallets.map((wallet) => (
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
