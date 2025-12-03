import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Award, CheckCircle2, Clock } from 'lucide-react';

export interface RewardTransaction {
  id: string;
  type: 'course_completion' | 'quiz_bonus' | 'referral';
  courseName?: string;
  amount: number;
  txHash: string;
  status: 'confirmed' | 'pending';
  date: string;
}

interface RewardHistoryProps {
  transactions: RewardTransaction[];
  maxHeight?: string;
}

const typeLabels = {
  course_completion: 'Course Completion',
  quiz_bonus: 'Quiz Bonus',
  referral: 'Referral Reward',
};

const typeIcons = {
  course_completion: Award,
  quiz_bonus: CheckCircle2,
  referral: Award,
};

export default function RewardHistory({ transactions, maxHeight = '400px' }: RewardHistoryProps) {
  return (
    <Card className="bg-card border-border" data-testid="card-reward-history">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-bmt-orange" />
          Reward History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-4">
            {transactions.map((tx) => {
              const Icon = typeIcons[tx.type];
              return (
                <div
                  key={tx.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="p-2 rounded-lg bg-bmt-orange/20">
                    <Icon className="w-5 h-5 text-bmt-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white truncate">
                        {typeLabels[tx.type]}
                      </span>
                      <Badge
                        variant="outline"
                        className={tx.status === 'confirmed' 
                          ? 'text-kaspa-green border-kaspa-green/30' 
                          : 'text-bmt-orange border-bmt-orange/30'
                        }
                      >
                        {tx.status === 'confirmed' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {tx.status}
                      </Badge>
                    </div>
                    {tx.courseName && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {tx.courseName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.date}</span>
                      <span className="font-mono text-kaspa-cyan">
                        {tx.txHash.slice(0, 12)}...
                      </span>
                      <Button size="icon" variant="ghost" className="h-5 w-5" data-testid={`button-view-tx-${tx.id}`}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-heading font-bold text-lg text-bmt-orange">
                      +{tx.amount.toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground">$BMT</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
