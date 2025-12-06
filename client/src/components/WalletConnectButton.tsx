import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Play, Wallet, LogOut, AlertCircle } from 'lucide-react';
import type { User } from '@shared/schema';
import { kasplexL2 } from '@/lib/wagmi';

const DEMO_WALLET_ADDRESS = '0xdead000000000000000000000000000000000001';

interface WalletConnectButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { toast } = useToast();
  
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending } = useConnect();

  useEffect(() => {
    const token = getAuthToken();
    const demoMode = localStorage.getItem('demoMode') === 'true';
    if (token) {
      verifyExistingSession(token);
      if (demoMode) {
        setIsDemoMode(true);
      }
    }
  }, []);

  useEffect(() => {
    if (address && isConnected && !isAuthenticated && !isAuthenticating && !isDemoMode) {
      handleAuthentication(address);
    }
  }, [address, isConnected, isAuthenticated, isAuthenticating, isDemoMode]);

  useEffect(() => {
    if (!isConnected && isAuthenticated && !isDemoMode) {
      handleWalletDisconnect();
    }
  }, [isConnected, isAuthenticated, isDemoMode]);

  const verifyExistingSession = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user: User = await res.json();
        if (user) {
          setIsAuthenticated(true);
        }
      } else {
        clearAuthToken();
      }
    } catch {
      clearAuthToken();
    }
  };

  const handleAuthentication = async (walletAddress: string) => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication nonce');
      }

      const { nonce } = await nonceRes.json();
      const signature = `0xrainbow_${nonce.slice(0, 32)}`;

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
      setIsAuthenticated(true);

      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });

      const pendingReferralCode = localStorage.getItem('pendingReferralCode');
      if (pendingReferralCode) {
        try {
          const applyRes = await fetch('/api/referrals/apply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ code: pendingReferralCode }),
          });

          if (applyRes.ok) {
            localStorage.removeItem('pendingReferralCode');
            queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-referrer'] });
            queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
            toast({
              title: 'Referral Applied!',
              description: 'Your referral code has been applied successfully.',
            });
          } else {
            const errorData = await applyRes.json().catch(() => ({}));
            localStorage.removeItem('pendingReferralCode');
            toast({
              title: 'Referral Code Invalid',
              description: errorData.error || 'The referral code could not be applied.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('Failed to apply pending referral:', err);
          localStorage.removeItem('pendingReferralCode');
        }
      }

      toast({
        title: 'Wallet Connected',
        description: 'You can now enroll in courses and earn $BMT rewards.',
      });

      onConnect?.();
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'Failed to authenticate wallet.',
        variant: 'destructive',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore logout errors
    }

    clearAuthToken();
    setIsAuthenticated(false);

    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
    queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });

    toast({
      title: 'Wallet Disconnected',
      description: 'You have been logged out.',
    });

    onDisconnect?.();
  };

  const handleDemoConnect = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: DEMO_WALLET_ADDRESS }),
      });

      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication nonce');
      }

      const { nonce } = await nonceRes.json();
      const signature = `0xdemo_${nonce}`;

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: DEMO_WALLET_ADDRESS, signature, isDemo: true }),
      });

      if (!verifyRes.ok) {
        throw new Error('Failed to verify demo wallet');
      }

      const { token } = await verifyRes.json();

      setAuthToken(token);
      localStorage.setItem('demoMode', 'true');
      setIsAuthenticated(true);
      setIsDemoMode(true);

      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });

      toast({
        title: 'Demo Mode Active',
        description: 'Explore BMT University with a demo wallet. No real transactions.',
      });

      onConnect?.();
    } catch (error) {
      console.error('Demo authentication error:', error);
      toast({
        title: 'Demo Mode Failed',
        description: error instanceof Error ? error.message : 'Failed to start demo mode.',
        variant: 'destructive',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDemoDisconnect = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore logout errors
    }

    clearAuthToken();
    localStorage.removeItem('demoMode');
    setIsAuthenticated(false);
    setIsDemoMode(false);

    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
    queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });

    toast({
      title: 'Demo Mode Ended',
      description: 'You have exited demo mode.',
    });

    onDisconnect?.();
  };

  if (isDemoMode && isAuthenticated) {
    return (
      <div data-testid="wallet-connect-container" className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg">
          <Play className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-500">Demo Mode</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDemoDisconnect}
          data-testid="button-demo-disconnect"
        >
          Exit Demo
        </Button>
      </div>
    );
  }

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    } else {
      toast({
        title: 'No Wallet Found',
        description: 'Please install MetaMask or another EVM wallet extension.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    handleWalletDisconnect();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isWrongNetwork = chain && chain.id !== kasplexL2.id;

  return (
    <div data-testid="wallet-connect-container" className="flex items-center gap-2">
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={isPending}
          className="bg-bmt-orange text-background hover:bg-bmt-orange/90"
          data-testid="button-connect-wallet"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      ) : isWrongNetwork ? (
        <Button
          variant="destructive"
          data-testid="button-wrong-network"
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Wrong Network
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">{chain?.name || 'Kasplex L2'}</span>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            data-testid="button-account"
            className="flex items-center gap-2"
          >
            {formatAddress(address || '')}
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {!isAuthenticated && !isConnected && (
        <Button
          variant="outline"
          onClick={handleDemoConnect}
          disabled={isAuthenticating}
          data-testid="button-demo-connect"
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isAuthenticating ? 'Loading...' : 'Try Demo'}
        </Button>
      )}
    </div>
  );
}
