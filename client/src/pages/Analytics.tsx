import StatsCard from '@/components/StatsCard';
import AnalyticsChart from '@/components/AnalyticsChart';
import CourseLeaderboard from '@/components/CourseLeaderboard';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import { Users, BookOpen, Coins, Award, TrendingUp, BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl text-white mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform metrics and on-chain activity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Students"
            value="1,247"
            icon={Users}
            trend={{ value: '156', isPositive: true }}
            accentColor="cyan"
          />
          <StatsCard
            title="Active Courses"
            value="24"
            icon={BookOpen}
            accentColor="cyan"
          />
          <StatsCard
            title="$BMT Distributed"
            value="2.4M"
            icon={Coins}
            trend={{ value: '340K', isPositive: true }}
            accentColor="orange"
          />
          <StatsCard
            title="Certificates Issued"
            value="892"
            icon={Award}
            accentColor="green"
          />
          <StatsCard
            title="Completion Rate"
            value="76%"
            icon={TrendingUp}
            trend={{ value: '4%', isPositive: true }}
            accentColor="green"
          />
          <StatsCard
            title="Avg. Quiz Score"
            value="84%"
            icon={BarChart3}
            accentColor="cyan"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsChart type="payouts" title="$BMT Payouts Over Time" />
          <AnalyticsChart type="students" title="Student Growth" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <CourseLeaderboard />
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
}
