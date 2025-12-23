import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useConnect, useSignMessage, useSwitchChain } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, clearAuthToken, setWalletAddress } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Play, Wallet, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [pendingNonce, setPendingNonce] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectAsync, connectors, isPending, error: connectError } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  // Detect if user is on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Show connection errors to the user
  useEffect(() => {
    if (connectError) {
      console.error('[Wallet] Connection error:', connectError);
      let errorMessage = 'Failed to connect wallet. Please try again.';
      let title = 'Connection Failed';
      
      // Parse common error types
      if (connectError.message?.includes('User rejected')) {
        errorMessage = 'Connection was rejected. Please approve the connection in your wallet.';
      } else if (connectError.message?.includes('Connector not found') || connectError.message?.includes('No provider')) {
        if (isMobile) {
          title = 'Open in Wallet App';
          errorMessage = 'Please open this site inside your MetaMask or Trust Wallet app browser. Mobile browsers cannot connect directly to wallets.';
        } else {
          errorMessage = 'No wallet extension found. Please install MetaMask or another EVM wallet.';
        }
      } else if (connectError.message?.includes('Chain')) {
        errorMessage = 'Network configuration issue. Please check your wallet settings.';
      } else if (isMobile && !window.ethereum) {
        title = 'Open in Wallet App';
        errorMessage = 'Please open this site inside your MetaMask or Trust Wallet app browser.';
      }
      
      toast({
        title,
        description: errorMessage,
        variant: 'destructive',
        duration: 10000,
      });
    }
  }, [connectError, toast, isMobile]);

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
      setPendingNonce(nonce);
      
      const message = `Sign this message to authenticate with BMT University: ${nonce}`;
      
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (signError) {
        console.error('User rejected signature:', signError);
        toast({
          title: 'Signature Required',
          description: 'Please sign the message to authenticate your wallet.',
          variant: 'destructive',
        });
        setIsAuthenticating(false);
        setPendingNonce(null);
        return;
      }
      
      const fingerprintHash = getDeviceFingerprint();

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature, fingerprintHash }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to verify wallet');
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
      setPendingNonce(null);

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
      setPendingNonce(null);
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
      <div data-testid="wallet-connect-container" className="flex items-center gap-1">
        <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-md">
          <Play className="h-3 w-3 text-amber-500" />
          <span className="text-xs font-medium text-amber-500">Demo</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDemoDisconnect}
          data-testid="button-demo-disconnect"
        >
          Exit
        </Button>
      </div>
    );
  }

  const handleConnect = async () => {
    console.log('[Wallet] Attempting to connect...');
    console.log('[Wallet] Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
    
    const injectedConnector = connectors.find(c => c.id === 'injected');
    const connector = injectedConnector || connectors[0];
    
    if (!connector) {
      console.error('[Wallet] No connectors available');
      toast({
        title: 'No Wallet Found',
        description: 'Please install MetaMask or another EVM wallet extension.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('[Wallet] Using connector:', connector.id, connector.name);
    
    try {
      await connectAsync({ connector });
      console.log('[Wallet] Connection successful');
    } catch (error) {
      console.error('[Wallet] Connection failed:', error);
      
      let errorMessage = 'Failed to connect wallet. Please try again.';
      const errorStr = error instanceof Error ? error.message : String(error);
      
      if (errorStr.includes('User rejected') || errorStr.includes('user rejected')) {
        errorMessage = 'Connection was rejected. Please approve the connection in your wallet.';
      } else if (errorStr.includes('already pending')) {
        errorMessage = 'A connection request is already pending. Please check your wallet extension.';
      } else if (errorStr.includes('No provider')) {
        errorMessage = 'No wallet provider found. Please make sure MetaMask or another wallet is installed and unlocked.';
      } else if (errorStr.includes('Chain') || errorStr.includes('chain')) {
        errorMessage = 'Network issue. Try adding the IGRA Testnet network to your wallet manually.';
      }
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
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

  const handleSwitchNetwork = async () => {
    console.log('[Wallet] Attempting to switch to Kasplex L2 network...');
    try {
      await switchChainAsync({ chainId: kasplexL2.id });
      console.log('[Wallet] Network switch successful');
      toast({
        title: 'Network Switched',
        description: 'Successfully connected to IGRA Testnet (Kasplex L2)',
      });
    } catch (error) {
      console.error('[Wallet] Network switch failed:', error);
      const errorStr = error instanceof Error ? error.message : String(error);
      
      // If network doesn't exist in wallet, provide manual add instructions
      if (errorStr.includes('chain has not been added') || errorStr.includes('Unrecognized chain')) {
        toast({
          title: 'Network Not Found',
          description: 'Please add IGRA Testnet manually: RPC https://rpc.kasplex.org, Chain ID 202555',
          variant: 'destructive',
          duration: 15000,
        });
      } else if (errorStr.includes('User rejected')) {
        toast({
          title: 'Switch Cancelled',
          description: 'Please approve the network switch in your wallet.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Network Switch Failed',
          description: 'Could not switch to IGRA Testnet. Please add it manually to your wallet.',
          variant: 'destructive',
        });
      }
    }
  };

  const isWrongNetwork = chain && chain.id !== kasplexL2.id;

  return (
    <div data-testid="wallet-connect-container" className="flex items-center gap-2">
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={isPending}
          size="sm"
          className="bg-bmt-orange text-background hover:bg-bmt-orange/90"
          data-testid="button-connect-wallet"
        >
          <Wallet className="h-4 w-4 mr-1" />
          {isPending ? 'Connecting...' : 'Connect'}
        </Button>
      ) : isWrongNetwork ? (
        <Button
          variant="destructive"
          size="sm"
          data-testid="button-wrong-network"
          className="flex items-center gap-1"
          onClick={handleSwitchNetwork}
          disabled={isSwitchingChain}
        >
          {isSwitchingChain ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {isSwitchingChain ? '...' : 'IGRA'}
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="font-medium">IGRA</span>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            data-testid="button-account"
            className="flex items-center gap-1"
          >
            {formatAddress(address || '')}
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {!isAuthenticated && !isConnected && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDemoConnect}
          disabled={isAuthenticating}
          data-testid="button-demo-connect"
          className="flex items-center gap-1"
        >
          <Play className="h-3 w-3" />
          {isAuthenticating ? '...' : 'Demo'}
        </Button>
      )}
    </div>
  );
}