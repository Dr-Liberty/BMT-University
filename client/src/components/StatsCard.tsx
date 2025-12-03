import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'cyan' | 'orange' | 'green';
}

const accentStyles = {
  cyan: 'border-t-kaspa-cyan text-kaspa-cyan',
  orange: 'border-t-bmt-orange text-bmt-orange',
  green: 'border-t-kaspa-green text-kaspa-green',
};

const iconBgStyles = {
  cyan: 'bg-kaspa-cyan/20',
  orange: 'bg-bmt-orange/20',
  green: 'bg-kaspa-green/20',
};

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  accentColor = 'cyan' 
}: StatsCardProps) {
  return (
    <Card className={`bg-card border-border border-t-4 ${accentStyles[accentColor].split(' ')[0]}`} data-testid={`card-stats-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="font-heading font-bold text-3xl text-white">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-kaspa-green' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : ''}{trend.value} from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBgStyles[accentColor]}`}>
            <Icon className={`w-6 h-6 ${accentStyles[accentColor].split(' ')[1]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
