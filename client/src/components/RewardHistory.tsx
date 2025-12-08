import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Award, CheckCircle2, Clock, Loader2, Coins } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface RewardTransaction {
  id: string;
  type: 'course_completion' | 'quiz_bonus' | 'referral';
  courseName?: string;
  amount: number;
  txHash?: string;
  status: 'confirmed' | 'pending' | 'processing' | 'failed';
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

export default function RewardHistory({ transactions, maxHeight }: RewardHistoryProps) {
  const { toast } = useToast();

  const claimMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await apiRequest('POST', `/api/rewards/${rewardId}/claim`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'processing') {
        toast({
          title: 'Transaction Submitted!',
          description: data.message || 'Confirming on blockchain...',
        });
      } else {
        toast({
          title: 'Reward Claimed!',
          description: `Successfully claimed ${data.amount?.toLocaleString() || 0} $BMT`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
    },
    onError: (error) => {
      toast({
        title: 'Claim Failed',
        description: error.message || 'Failed to claim reward',
        variant: 'destructive',
      });
    },
  });

  const totalPending = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const totalConfirmed = transactions.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className="bg-card border-border" data-testid="card-reward-history">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-bmt-orange" />
            Reward History
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            {totalPending > 0 && (
              <span className="text-bmt-orange">
                <Clock className="w-4 h-4 inline mr-1" />
                {totalPending.toLocaleString()} pending
              </span>
            )}
            <span className="text-kaspa-green">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              {totalConfirmed.toLocaleString()} claimed
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={maxHeight ? "overflow-y-auto pr-4" : "space-y-4"} style={maxHeight ? { maxHeight } : undefined}>
          <div className="space-y-4">
            {transactions.map((tx) => {
              const Icon = typeIcons[tx.type];
              const isPending = tx.status === 'pending';
              const isProcessing = tx.status === 'processing';
              const isFailed = tx.status === 'failed';
              const canClaim = isPending || isFailed;
              const isClaiming = claimMutation.isPending && claimMutation.variables === tx.id;
              
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white truncate">
                        {typeLabels[tx.type]}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          tx.status === 'confirmed' 
                            ? 'text-kaspa-green border-kaspa-green/30' 
                            : tx.status === 'pending'
                              ? 'text-bmt-orange border-bmt-orange/30'
                              : tx.status === 'processing'
                                ? 'text-kaspa-cyan border-kaspa-cyan/30'
                                : 'text-destructive border-destructive/30'
                        }
                      >
                        {tx.status === 'confirmed' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : tx.status === 'pending' ? (
                          <Clock className="w-3 h-3 mr-1" />
                        ) : tx.status === 'processing' ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : null}
                        {tx.status === 'processing' ? 'confirming' : tx.status}
                      </Badge>
                    </div>
                    {tx.courseName && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {tx.courseName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.date}</span>
                      {tx.txHash && (
                        <>
                          <span className="font-mono text-kaspa-cyan">
                            {tx.txHash.slice(0, 12)}...
                          </span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-5 w-5" 
                            data-testid={`button-view-tx-${tx.id}`}
                            onClick={() => window.open(`https://explorer.kaspa.org/tx/${tx.txHash}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div>
                      <span className="font-heading font-bold text-lg text-bmt-orange">
                        +{tx.amount.toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground">$BMT</p>
                    </div>
                    {canClaim && (
                      <Button
                        size="sm"
                        onClick={() => claimMutation.mutate(tx.id)}
                        disabled={isClaiming}
                        className="bg-bmt-orange text-background hover:bg-bmt-orange/90 gap-1"
                        data-testid={`button-claim-${tx.id}`}
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Coins className="w-3 h-3" />
                            {isFailed ? 'Retry' : 'Claim'}
                          </>
                        )}
                      </Button>
                    )}
                    {isProcessing && (
                      <div className="text-xs text-kaspa-cyan flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Confirming...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
