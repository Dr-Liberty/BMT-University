import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// todo: remove mock functionality
const payoutData = [
  { month: 'Jul', amount: 12500 },
  { month: 'Aug', amount: 18200 },
  { month: 'Sep', amount: 25400 },
  { month: 'Oct', amount: 31200 },
  { month: 'Nov', amount: 42800 },
  { month: 'Dec', amount: 58600 },
];

const studentData = [
  { month: 'Jul', students: 120 },
  { month: 'Aug', students: 245 },
  { month: 'Sep', students: 412 },
  { month: 'Oct', students: 687 },
  { month: 'Nov', students: 924 },
  { month: 'Dec', students: 1247 },
];

interface AnalyticsChartProps {
  type: 'payouts' | 'students';
  title: string;
}

export default function AnalyticsChart({ type, title }: AnalyticsChartProps) {
  const data = type === 'payouts' ? payoutData : studentData;
  const dataKey = type === 'payouts' ? 'amount' : 'students';
  const color = type === 'payouts' ? '#FFB84D' : '#00D4FF';

  return (
    <Card className="bg-card border-border" data-testid={`chart-${type}`}>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2F45" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7385" 
                tick={{ fill: '#6B7385' }}
                axisLine={{ stroke: '#2A2F45' }}
              />
              <YAxis 
                stroke="#6B7385" 
                tick={{ fill: '#6B7385' }}
                axisLine={{ stroke: '#2A2F45' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141824',
                  border: '1px solid #2A2F45',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                labelStyle={{ color: '#A0A8C0' }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${type})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
