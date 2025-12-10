import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, clearAuthToken, setWalletAddress } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Wallet, LogOut, AlertCircle, ShieldAlert } from 'lucide-react';
import type { User } from '@shared/schema';
import { kasplexL2 } from '@/lib/wagmi';

const DEMO_WALLET_ADDRESS = '0xdead000000000000000000000000000000000001';

function getDeviceFingerprint(): string {
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  
  const fingerprintData = `${navigator.userAgent}|${screenResolution}|${timezone}|${language}|${platform}`;
  
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36).padStart(12, '0');
}

interface WalletConnectButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const [vpnDetected, setVpnDetected] = useState(false);
  const [showVpnWarning, setShowVpnWarning] = useState(false);
  const [vpnCheckDone, setVpnCheckDone] = useState(false);
  const { toast } = useToast();
  
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending } = useConnect();

  // Check VPN status on mount
  useEffect(() => {
    const checkVpnStatus = async () => {
      try {
        const res = await fetch('/api/check-vpn');
        if (res.ok) {
          const data = await res.json();
          if (data.isVpn || data.isProxy) {
            setVpnDetected(true);
          }
        }
      } catch (e) {
        // Silently fail - don't block users if check fails
      }
      setVpnCheckDone(true);
    };
    checkVpnStatus();
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    const demoMode = localStorage.getItem('demoMode') === 'true';
    if (token) {
      verifyExistingSession(token, demoMode);
    }
  }, []);

  useEffect(() => {
    if (address && isConnected && !isAuthenticated && !isAuthenticating && !isDemoMode && !isVerifyingSession) {
      handleAuthentication(address);
    }
  }, [address, isConnected, isAuthenticated, isAuthenticating, isDemoMode, isVerifyingSession]);

  useEffect(() => {
    if (!isConnected && isAuthenticated && !isDemoMode) {
      handleWalletDisconnect();
    }
  }, [isConnected, isAuthenticated, isDemoMode]);

  const verifyExistingSession = async (token: string, demoMode: boolean) => {
    setIsVerifyingSession(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user: User = await res.json();
        if (user) {
          setIsAuthenticated(true);
          if (demoMode) {
            setIsDemoMode(true);
          }
        } else {
          clearAuthToken();
          localStorage.removeItem('demoMode');
          setIsAuthenticated(false);
          setIsDemoMode(false);
        }
      } else {
        clearAuthToken();
        localStorage.removeItem('demoMode');
        setIsAuthenticated(false);
        setIsDemoMode(false);
      }
    } catch {
      clearAuthToken();
      localStorage.removeItem('demoMode');
      setIsAuthenticated(false);
      setIsDemoMode(false);
    } finally {
      setIsVerifyingSession(false);
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
      const fingerprintHash = getDeviceFingerprint();

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature, fingerprintHash }),
      });

      if (!verifyRes.ok) {
        throw new Error('Failed to verify wallet');
      }

      const { token, farmingWarning } = await verifyRes.json();
      
      if (farmingWarning) {
        toast({
          title: farmingWarning.type === 'farming_blocked' ? 'Account Blocked' : 'Warning: Farming Detected',
          description: farmingWarning.message,
          variant: 'destructive',
          duration: 15000,
        });
      }

      setAuthToken(token);
      setWalletAddress(walletAddress);
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
      const fingerprintHash = getDeviceFingerprint();

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: DEMO_WALLET_ADDRESS, signature, isDemo: true, fingerprintHash }),
      });

      if (!verifyRes.ok) {
        throw new Error('Failed to verify demo wallet');
      }

      const { token } = await verifyRes.json();

      setAuthToken(token);
      setWalletAddress(DEMO_WALLET_ADDRESS);
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

  const handleConnectClick = () => {
    // If VPN detected, show warning first
    if (vpnDetected && vpnCheckDone) {
      setShowVpnWarning(true);
      return;
    }
    proceedWithConnect();
  };

  const proceedWithConnect = () => {
    setShowVpnWarning(false);
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
    <>
      <Dialog open={showVpnWarning} onOpenChange={setShowVpnWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
              VPN Detected
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              We detected that you may be using a VPN or proxy. To prevent your account from being flagged for suspicious activity, please disable your VPN before connecting your wallet.
              <br /><br />
              <span className="text-muted-foreground text-sm">
                Note: Connecting while on a VPN may result in restrictions on claiming rewards.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowVpnWarning(false)}>
              Cancel
            </Button>
            <Button 
              onClick={proceedWithConnect}
              className="bg-amber-500 hover:bg-amber-600 text-background"
            >
              Connect Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div data-testid="wallet-connect-container" className="flex items-center gap-2">
        {!isConnected ? (
          <Button
            onClick={handleConnectClick}
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
    </>
  );
}
