import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, DollarSign, BarChart3, Coins } from 'lucide-react';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764822949579.jpg';

const BMT_TOKEN_ADDRESS = '0x35fBa50F52e2AA305438134c646957066608d976';

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  totalSupply: string;
  tokenPriceUSD: number;
  marketCapUSD: number;
  holders: number;
  volume24h?: number;
}

function formatPrice(price: number): string {
  if (price < 0.0001) {
    return `$${price.toFixed(9)}`;
  } else if (price < 1) {
    return `$${price.toFixed(6)}`;
  }
  return `$${price.toFixed(2)}`;
}

function formatMarketCap(cap: number): string {
  if (cap >= 1_000_000) {
    return `$${(cap / 1_000_000).toFixed(2)}M`;
  } else if (cap >= 1_000) {
    return `$${(cap / 1_000).toFixed(1)}K`;
  }
  return `$${cap.toFixed(0)}`;
}

function formatSupply(supply: string): string {
  const num = parseFloat(supply);
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  return num.toLocaleString();
}

function formatHolders(holders: number): string {
  return holders.toLocaleString();
}

export default function TokenStats() {
  const { data: tokenData, isLoading, error } = useQuery<TokenData>({
    queryKey: ['/api/token', BMT_TOKEN_ADDRESS],
    refetchInterval: 60000,
  });

  const stats = tokenData ? [
    { 
      label: 'Price', 
      value: formatPrice(tokenData.tokenPriceUSD), 
      icon: DollarSign 
    },
    { 
      label: 'Market Cap', 
      value: formatMarketCap(tokenData.marketCapUSD), 
      icon: BarChart3 
    },
    { 
      label: 'Holders', 
      value: formatHolders(tokenData.holders), 
      icon: Users 
    },
    { 
      label: 'Total Supply', 
      value: formatSupply(tokenData.totalSupply), 
      icon: Coins 
    },
  ] : [];

  return (
    <section className="py-16 px-4 sm:px-6" data-testid="section-token-stats">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <img
            src={bmtLogo}
            alt="$BMT"
            className="w-12 h-12 rounded-full border-2 border-[#E8D5B0]"
          />
          <div>
            <h2 className="font-heading font-bold text-2xl text-white">About $BMT</h2>
            <p className="text-muted-foreground">Bitcoin Maxi Tears on Kasplex</p>
          </div>
          <div className="ml-auto">
            {isLoading ? (
              <Skeleton className="w-16 h-6 rounded-full" />
            ) : error ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium">
                Offline
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-kaspa-green/20 text-kaspa-green text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-kaspa-green mr-2 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              <p>Unable to load token data</p>
              <p className="text-xs mt-1">Data will refresh automatically</p>
            </div>
          ) : (
            stats.map((stat, index) => (
              <Card key={index} className="bg-card border-border hover:border-kaspa-cyan/30 transition-colors" data-testid={`card-stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-kaspa-cyan" />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-heading font-bold text-xl text-white" data-testid={`text-${stat.label.toLowerCase().replace(' ', '-')}-value`}>
                      {stat.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          Data from Kaspacom DEX • Refreshes every 60 seconds
        </p>
      </div>
    </section>
  );
}
