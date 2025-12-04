import { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount, useDisconnect } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { thirdwebClient, kasplexL2 } from '@/lib/thirdweb';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/auth';
import type { User } from '@shared/schema';

interface WalletConnectButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "apple", "phone"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("app.phantom"),
];

export default function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      verifyExistingSession(token);
    }
  }, []);

  useEffect(() => {
    if (account?.address && !isAuthenticated && !isAuthenticating) {
      handleAuthentication(account.address);
    }
  }, [account?.address, isAuthenticated, isAuthenticating]);

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
      const signature = `0xthirdweb_${nonce.slice(0, 32)}`;

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
      // Ignore logout errors
    }

    clearAuthToken();
    setIsAuthenticated(false);
    disconnect(wallets[0] as any);
    
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

  if (!import.meta.env.VITE_THIRDWEB_CLIENT_ID) {
    return (
      <div className="text-muted-foreground text-sm px-3 py-2 bg-muted rounded-lg">
        Configure VITE_THIRDWEB_CLIENT_ID
      </div>
    );
  }

  return (
    <div data-testid="wallet-connect-container">
      <ConnectButton
        client={thirdwebClient}
        wallets={wallets}
        chain={kasplexL2}
        theme="dark"
        connectModal={{
          size: "compact",
          title: "Connect to BMT University",
          showThirdwebBranding: false,
        }}
        connectButton={{
          label: "Connect Wallet",
          className: "!bg-bmt-orange !text-background hover:!bg-bmt-orange/90 !font-medium !px-4 !py-2 !rounded-lg",
        }}
        detailsButton={{
          displayBalanceToken: {
            [kasplexL2.id]: "0x35fBa50F52e2AA305438134c646957066608d976",
          },
        }}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}
