import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, ArrowRight, Award, BookOpen, Coins } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'completion' | 'payout';
  address: string;
  courseName?: string;
  amount?: number;
  timestamp: string;
}

// todo: remove mock functionality
const generateMockActivity = (): ActivityItem => {
  const types: ActivityItem['type'][] = ['enrollment', 'completion', 'payout'];
  const courses = ['Kaspa Basics', 'DeFi Trading', 'NFT Creation', 'Token Dev'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: Math.random().toString(36).slice(2),
    type,
    address: '0x' + Math.random().toString(16).slice(2, 8) + '...' + Math.random().toString(16).slice(2, 6),
    courseName: type !== 'payout' ? courses[Math.floor(Math.random() * courses.length)] : undefined,
    amount: type === 'payout' ? Math.floor(Math.random() * 1000) + 100 : undefined,
    timestamp: 'Just now',
  };
};

const typeIcons = {
  enrollment: BookOpen,
  completion: Award,
  payout: Coins,
};

const typeColors = {
  enrollment: 'text-kaspa-cyan',
  completion: 'text-kaspa-green',
  payout: 'text-bmt-orange',
};

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([
    generateMockActivity(),
    generateMockActivity(),
    generateMockActivity(),
    generateMockActivity(),
    generateMockActivity(),
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => [generateMockActivity(), ...prev.slice(0, 9)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card border-border" data-testid="card-live-activity">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-kaspa-cyan" />
          Live Activity
          <Badge className="ml-auto bg-kaspa-green/20 text-kaspa-green border-kaspa-green/30 animate-pulse">
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = typeIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300"
                  data-testid={`row-activity-${activity.id}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${typeColors[activity.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-kaspa-cyan">{activity.address}</span>
                      {activity.type === 'enrollment' && (
                        <>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">enrolled in {activity.courseName}</span>
                        </>
                      )}
                      {activity.type === 'completion' && (
                        <>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">completed {activity.courseName}</span>
                        </>
                      )}
                      {activity.type === 'payout' && (
                        <>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-bmt-orange font-semibold">+{activity.amount} $BMT</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{activity.timestamp}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
