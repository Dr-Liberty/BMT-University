import StatsCard from '../StatsCard';
import { BookOpen, Award, Coins, TrendingUp } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-background">
      <StatsCard
        title="Courses Enrolled"
        value="12"
        subtitle="3 in progress"
        icon={BookOpen}
        accentColor="cyan"
      />
      <StatsCard
        title="Certificates Earned"
        value="8"
        icon={Award}
        trend={{ value: '2', isPositive: true }}
        accentColor="green"
      />
      <StatsCard
        title="$BMT Earned"
        value="15,420"
        icon={Coins}
        trend={{ value: '1,200', isPositive: true }}
        accentColor="orange"
      />
      <StatsCard
        title="Learning Streak"
        value="14 days"
        icon={TrendingUp}
        accentColor="cyan"
      />
    </div>
  );
}
