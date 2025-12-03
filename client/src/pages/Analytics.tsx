import { useQuery } from '@tanstack/react-query';
import StatsCard from '@/components/StatsCard';
import CourseLeaderboard from '@/components/CourseLeaderboard';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import { Users, BookOpen, Coins, Award, TrendingUp, BarChart3, Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlatformStats {
  totalCourses: number;
  totalStudents: number;
  totalBmtDistributed: number;
  pendingBmt: number;
  certificatesIssued: number;
  completionRate: number;
  avgQuizScore: number;
  averageRating: string;
}

interface LeaderboardEntry {
  id: string;
  title: string;
  category: string;
  enrollmentCount: number;
  completions: number;
  totalBmtPaid: number;
  rating: string | null;
}

interface Activity {
  id: string;
  type: 'reward_claimed' | 'certificate_issued' | 'course_completed';
  description: string;
  amount?: number;
  timestamp: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/stats'],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/analytics/leaderboard'],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/analytics/activity'],
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-analytics">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
            value={formatNumber(stats?.totalStudents || 0)}
            icon={Users}
            accentColor="cyan"
          />
          <StatsCard
            title="Active Courses"
            value={stats?.totalCourses.toString() || '0'}
            icon={BookOpen}
            accentColor="cyan"
          />
          <StatsCard
            title="$BMT Distributed"
            value={formatNumber(stats?.totalBmtDistributed || 0)}
            icon={Coins}
            trend={stats?.pendingBmt ? { value: `${formatNumber(stats.pendingBmt)} pending`, isPositive: true } : undefined}
            accentColor="orange"
          />
          <StatsCard
            title="Certificates Issued"
            value={stats?.certificatesIssued.toString() || '0'}
            icon={Award}
            accentColor="green"
          />
          <StatsCard
            title="Completion Rate"
            value={`${stats?.completionRate || 0}%`}
            icon={TrendingUp}
            accentColor="green"
          />
          <StatsCard
            title="Avg. Quiz Score"
            value={`${stats?.avgQuizScore || 0}%`}
            icon={BarChart3}
            accentColor="cyan"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border" data-testid="card-leaderboard">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-kaspa-cyan" />
                Course Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-kaspa-cyan animate-spin" />
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((course, index) => (
                    <div 
                      key={course.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border"
                      data-testid={`row-leaderboard-${course.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-kaspa-cyan/20 flex items-center justify-center text-kaspa-cyan font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{course.enrollmentCount}</p>
                        <p className="text-xs text-muted-foreground">students</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-bmt-orange">{formatNumber(course.totalBmtPaid)}</p>
                        <p className="text-xs text-muted-foreground">$BMT paid</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No course data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border" data-testid="card-activity-feed">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-kaspa-cyan" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-kaspa-cyan animate-spin" />
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {activities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                      data-testid={`row-activity-${activity.id}`}
                    >
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'reward_claimed' 
                          ? 'bg-bmt-orange/20' 
                          : 'bg-kaspa-green/20'
                      }`}>
                        {activity.type === 'reward_claimed' ? (
                          <Coins className="w-4 h-4 text-bmt-orange" />
                        ) : (
                          <Award className="w-4 h-4 text-kaspa-green" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.amount && (
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-bmt-orange">
                            +{activity.amount.toLocaleString()}
                          </span>
                          <p className="text-xs text-muted-foreground">$BMT</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
