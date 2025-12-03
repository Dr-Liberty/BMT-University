import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Wallet, RefreshCw, Settings, Coins, CheckCircle, Clock, AlertCircle, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymasterConfig {
  configured: boolean;
  id?: string;
  walletAddress?: string;
  tokenContractAddress?: string;
  tokenTicker?: string;
  tokenDecimals?: number;
  chainId?: number;
  rpcUrl?: string;
  isActive?: boolean;
  minPayoutAmount?: number;
  autoPayoutEnabled?: boolean;
  liveBalance?: string;
  formattedBalance?: string;
  cachedBalance?: string;
  lastBalanceCheck?: string;
}

interface PayoutSummary {
  pendingCount: number;
  pendingTotal: number;
  completedCount: number;
  completedTotal: number;
  tokenTicker: string;
  tokenDecimals: number;
}

interface Payout {
  id: string;
  rewardId: string;
  userId: string;
  recipientAddress: string;
  amount: number;
  tokenTicker: string;
  status: string;
  txHash?: string;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
  userWallet?: string;
  userDisplayName?: string;
}

interface CourseWithStats {
  id: string;
  title: string;
  bmtReward: number;
  totalPaid: number;
  pendingAmount: number;
  rewardsClaimed: number;
  rewardsPending: number;
  isPublished: boolean;
}

export default function Admin() {
  const { toast } = useToast();
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [newRewardAmount, setNewRewardAmount] = useState<number>(0);

  const { data: paymasterConfig, isLoading: configLoading } = useQuery<PaymasterConfig>({
    queryKey: ['/api/admin/paymaster'],
  });

  const { data: payoutSummary, isLoading: summaryLoading } = useQuery<PayoutSummary>({
    queryKey: ['/api/admin/payouts/summary'],
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery<Payout[]>({
    queryKey: ['/api/admin/payouts'],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithStats[]>({
    queryKey: ['/api/admin/courses'],
  });

  const [formData, setFormData] = useState({
    walletAddress: '',
    tokenContractAddress: '',
    tokenTicker: 'BMT',
    tokenDecimals: 18,
    chainId: 202555,
    rpcUrl: 'https://evmrpc.kasplex.org',
    minPayoutAmount: 1,
    autoPayoutEnabled: false,
    isActive: true,
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/admin/paymaster', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/paymaster'] });
      toast({ title: "Configuration saved", description: "Paymaster wallet settings updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save configuration", variant: "destructive" });
    },
  });

  const refreshBalanceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/paymaster/refresh-balance');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/paymaster'] });
      toast({ title: "Balance refreshed", description: "Latest balance fetched from Kasplex EVM." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to refresh balance", variant: "destructive" });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async ({ courseId, bmtReward }: { courseId: string; bmtReward: number }) => {
      return apiRequest('PATCH', `/api/admin/courses/${courseId}/reward`, { bmtReward });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setEditingReward(null);
      toast({ title: "Reward updated", description: "Course reward amount updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update reward", variant: "destructive" });
    },
  });

  const completePayoutMutation = useMutation({
    mutationFn: async ({ payoutId, txHash }: { payoutId: string; txHash?: string }) => {
      return apiRequest('POST', `/api/admin/payouts/${payoutId}/complete`, { txHash });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts/summary'] });
      toast({ title: "Payout completed", description: "Payout marked as completed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to complete payout", variant: "destructive" });
    },
  });

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(formData);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (configLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="paymaster" className="space-y-6">
        <TabsList>
          <TabsTrigger value="paymaster" data-testid="tab-paymaster">
            <Wallet className="w-4 h-4 mr-2" />
            Paymaster Wallet
          </TabsTrigger>
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            <Coins className="w-4 h-4 mr-2" />
            Course Rewards
          </TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-payouts">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paymaster">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Paymaster Wallet Configuration
                </CardTitle>
                <CardDescription>
                  Configure the EVM wallet that holds $BMT tokens for student rewards on Kasplex Layer 2.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Paymaster Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="0x..."
                    value={formData.walletAddress || paymasterConfig?.walletAddress || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                    data-testid="input-wallet-address"
                  />
                  <p className="text-xs text-muted-foreground">The EVM wallet address that will send $BMT rewards</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenContractAddress">BMT Token Contract Address</Label>
                  <Input
                    id="tokenContractAddress"
                    placeholder="0x..."
                    value={formData.tokenContractAddress || paymasterConfig?.tokenContractAddress || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tokenContractAddress: e.target.value }))}
                    data-testid="input-token-contract"
                  />
                  <p className="text-xs text-muted-foreground">The ERC20 contract address for $BMT on Kasplex L2</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenTicker">Token Symbol</Label>
                    <Input
                      id="tokenTicker"
                      placeholder="BMT"
                      value={formData.tokenTicker || paymasterConfig?.tokenTicker || 'BMT'}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenTicker: e.target.value }))}
                      data-testid="input-token-ticker"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenDecimals">Token Decimals</Label>
                    <Input
                      id="tokenDecimals"
                      type="number"
                      placeholder="18"
                      value={formData.tokenDecimals || paymasterConfig?.tokenDecimals || 18}
                      onChange={(e) => setFormData(prev => ({ ...prev, tokenDecimals: parseInt(e.target.value) || 18 }))}
                      data-testid="input-token-decimals"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chainId">Chain ID</Label>
                    <Input
                      id="chainId"
                      type="number"
                      value={formData.chainId || paymasterConfig?.chainId || 202555}
                      onChange={(e) => setFormData(prev => ({ ...prev, chainId: parseInt(e.target.value) || 202555 }))}
                      data-testid="input-chain-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minPayoutAmount">Min Payout</Label>
                    <Input
                      id="minPayoutAmount"
                      type="number"
                      value={formData.minPayoutAmount || paymasterConfig?.minPayoutAmount || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, minPayoutAmount: parseInt(e.target.value) || 1 }))}
                      data-testid="input-min-payout"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rpcUrl">RPC URL</Label>
                  <Input
                    id="rpcUrl"
                    placeholder="https://evmrpc.kasplex.org"
                    value={formData.rpcUrl || paymasterConfig?.rpcUrl || 'https://evmrpc.kasplex.org'}
                    onChange={(e) => setFormData(prev => ({ ...prev, rpcUrl: e.target.value }))}
                    data-testid="input-rpc-url"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">Enable/disable payouts</p>
                  </div>
                  <Switch
                    checked={formData.isActive ?? paymasterConfig?.isActive ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    data-testid="switch-active"
                  />
                </div>

                <Button 
                  onClick={handleSaveConfig} 
                  className="w-full"
                  disabled={saveConfigMutation.isPending}
                  data-testid="button-save-config"
                >
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Wallet Balance
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshBalanceMutation.mutate()}
                    disabled={refreshBalanceMutation.isPending || !paymasterConfig?.configured}
                    data-testid="button-refresh-balance"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshBalanceMutation.isPending ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Live balance of $BMT tokens in the paymaster wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymasterConfig?.configured ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <p className="text-4xl font-bold text-primary" data-testid="text-balance">
                        {paymasterConfig.formattedBalance || '0'}
                      </p>
                      <p className="text-muted-foreground">${paymasterConfig.tokenTicker || 'BMT'}</p>
                    </div>
                    
                    {paymasterConfig.lastBalanceCheck && (
                      <p className="text-xs text-muted-foreground text-center">
                        Last updated: {new Date(paymasterConfig.lastBalanceCheck).toLocaleString()}
                      </p>
                    )}

                    {!summaryLoading && payoutSummary && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-yellow-600" data-testid="text-pending-payouts">
                            {payoutSummary.pendingTotal}
                          </p>
                          <p className="text-sm text-muted-foreground">Pending Payouts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-semibold text-green-600" data-testid="text-completed-payouts">
                            {payoutSummary.completedTotal}
                          </p>
                          <p className="text-sm text-muted-foreground">Total Paid</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Configure your paymaster wallet to see balance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Course Reward Settings</CardTitle>
              <CardDescription>
                Adjust the $BMT reward amount for each course. Changes apply to new completions only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Reward</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses?.map((course) => (
                      <TableRow key={course.id} data-testid={`row-course-${course.id}`}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          {course.isPublished ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingReward === course.id ? (
                            <Input
                              type="number"
                              className="w-24 text-right"
                              value={newRewardAmount}
                              onChange={(e) => setNewRewardAmount(parseInt(e.target.value) || 0)}
                              data-testid={`input-reward-${course.id}`}
                            />
                          ) : (
                            <span className="font-semibold">{course.bmtReward} $BMT</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {course.totalPaid} ({course.rewardsClaimed})
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          {course.pendingAmount} ({course.rewardsPending})
                        </TableCell>
                        <TableCell>
                          {editingReward === course.id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateRewardMutation.mutate({ courseId: course.id, bmtReward: newRewardAmount })}
                                disabled={updateRewardMutation.isPending}
                                data-testid={`button-save-reward-${course.id}`}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingReward(null)}
                                data-testid={`button-cancel-reward-${course.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingReward(course.id);
                                setNewRewardAmount(course.bmtReward);
                              }}
                              data-testid={`button-edit-reward-${course.id}`}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Queue</CardTitle>
              <CardDescription>
                Manage pending and completed $BMT payouts to students. Mark as completed after manually sending tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : payouts && payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payout.userDisplayName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {payout.recipientAddress.slice(0, 8)}...{payout.recipientAddress.slice(-6)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {payout.amount} ${payout.tokenTicker}
                        </TableCell>
                        <TableCell>{statusBadge(payout.status)}</TableCell>
                        <TableCell>
                          {payout.txHash ? (
                            <span className="font-mono text-xs">
                              {payout.txHash.slice(0, 10)}...
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {payout.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => completePayoutMutation.mutate({ payoutId: payout.id })}
                              disabled={completePayoutMutation.isPending}
                              data-testid={`button-complete-${payout.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowUpRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payouts yet</p>
                  <p className="text-sm">Payouts will appear here when students claim their rewards</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
