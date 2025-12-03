import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, BarChart3, Coins } from 'lucide-react';
import bmtLogo from '@assets/Gemini_Generated_Image_a36drsa36drsa36d_1764781999555.png';

interface TokenStat {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: typeof TrendingUp;
}

// todo: remove mock functionality
const tokenStats: TokenStat[] = [
  { label: 'Price', value: '$0.000042', change: '+12.5%', isPositive: true, icon: DollarSign },
  { label: 'Market Cap', value: '$4.2M', change: '+8.3%', isPositive: true, icon: BarChart3 },
  { label: 'Holders', value: '8,421', change: '+156', isPositive: true, icon: Users },
  { label: 'Total Supply', value: '100B', icon: Coins },
];

export default function TokenStats() {
  return (
    <section className="py-16 px-4 sm:px-6" data-testid="section-token-stats">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <img
            src={bmtLogo}
            alt="$BMT"
            className="w-12 h-12 object-contain"
          />
          <div>
            <h2 className="font-heading font-bold text-2xl text-white">About $BMT</h2>
            <p className="text-muted-foreground">Bitcoin Maxi Tears on Kasplex</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-kaspa-green/20 text-kaspa-green text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-kaspa-green mr-2 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tokenStats.map((stat, index) => (
            <Card key={index} className="bg-card border-border hover:border-kaspa-cyan/30 transition-colors" data-testid={`card-stat-${stat.label.toLowerCase()}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-kaspa-cyan" />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="font-heading font-bold text-xl text-white">{stat.value}</span>
                  {stat.change && (
                    <span className={`text-sm flex items-center ${stat.isPositive ? 'text-kaspa-green' : 'text-destructive'}`}>
                      {stat.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stat.change}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
