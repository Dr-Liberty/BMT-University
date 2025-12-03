import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Users } from 'lucide-react';

interface LeaderboardCourse {
  id: string;
  rank: number;
  title: string;
  students: number;
  completionRate: number;
  trending: boolean;
}

// todo: remove mock functionality
const topCourses: LeaderboardCourse[] = [
  { id: '1', rank: 1, title: 'Introduction to Kaspa Blockchain', students: 1247, completionRate: 78, trending: true },
  { id: '2', rank: 2, title: 'DeFi Trading Strategies', students: 2134, completionRate: 65, trending: true },
  { id: '3', rank: 3, title: 'NFT Creation & Marketing', students: 1876, completionRate: 72, trending: false },
  { id: '4', rank: 4, title: 'KRC-20 Token Development', students: 856, completionRate: 81, trending: true },
  { id: '5', rank: 5, title: 'Crypto Fundamentals', students: 3421, completionRate: 88, trending: false },
];

export default function CourseLeaderboard() {
  return (
    <Card className="bg-card border-border" data-testid="card-course-leaderboard">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-bmt-orange" />
          Top Performing Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCourses.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border"
              data-testid={`row-leaderboard-${course.id}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold ${
                course.rank === 1 ? 'bg-bmt-orange text-background' :
                course.rank === 2 ? 'bg-muted-foreground/30 text-white' :
                course.rank === 3 ? 'bg-bmt-orange/40 text-bmt-orange' :
                'bg-muted text-muted-foreground'
              }`}>
                {course.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate">{course.title}</span>
                  {course.trending && (
                    <Badge variant="outline" className="text-kaspa-green border-kaspa-green/30 shrink-0">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.students.toLocaleString()}
                  </span>
                  <span>{course.completionRate}% completion</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
