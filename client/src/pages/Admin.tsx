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
import { Wallet, RefreshCw, Settings, Coins, CheckCircle, Clock, AlertCircle, ArrowUpRight, Key, AlertTriangle, TrendingUp, Users, DollarSign, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface PaymasterConfig {
  configured: boolean;
  privateKeyConfigured?: boolean;
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
  network?: {
    network: string;
    chainId: number;
    rpc: string;
    explorer: string;
  };
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
  description?: string;
  shortDescription?: string;
  category?: string;
  difficulty?: string;
  duration?: number;
  bmtReward: number;
  totalPaid: number;
  pendingAmount: number;
  rewardsClaimed: number;
  rewardsPending: number;
  isPublished: boolean;
}

interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  difficulty: string;
  duration: number;
  bmtReward: number;
  isPublished: boolean;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  totalSupply: string;
  tokenPriceUSD: number;
  marketCapUSD: number;
  holders: number;
  volume24h?: number;
  priceChange24h?: number;
}

const defaultCourseForm: CourseFormData = {
  title: '',
  description: '',
  shortDescription: '',
  category: 'blockchain',
  difficulty: 'beginner',
  duration: 60,
  bmtReward: 5000,
  isPublished: false,
};

export default function Admin() {
  const { toast } = useToast();
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [newRewardAmount, setNewRewardAmount] = useState<number>(0);
  
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormData>(defaultCourseForm);

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

  const { data: tokenData, isLoading: tokenDataLoading, error: tokenDataError, refetch: refetchTokenData } = useQuery<TokenData>({
    queryKey: ['/api/admin/token-data'],
    enabled: !!paymasterConfig?.tokenContractAddress,
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/token-data'] });
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

  const processPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return apiRequest('POST', `/api/admin/payouts/${payoutId}/process`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/paymaster'] });
      toast({ 
        title: "Payout processed on blockchain", 
        description: `Transaction confirmed: ${data.blockchainResult?.txHash?.slice(0, 16)}...`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Blockchain transaction failed", 
        description: error.message || "Failed to process payout", 
        variant: "destructive" 
      });
    },
  });

  const completePayoutMutation = useMutation({
    mutationFn: async ({ payoutId, txHash }: { payoutId: string; txHash?: string }) => {
      return apiRequest('POST', `/api/admin/payouts/${payoutId}/complete`, { txHash });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payouts/summary'] });
      toast({ title: "Payout completed", description: "Payout marked as completed manually." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to complete payout", variant: "destructive" });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      return apiRequest('POST', '/api/courses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setCourseDialogOpen(false);
      setCourseForm(defaultCourseForm);
      toast({ title: "Course created", description: "New course has been created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create course", variant: "destructive" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseFormData> }) => {
      return apiRequest('PUT', `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setCourseDialogOpen(false);
      setEditingCourse(null);
      setCourseForm(defaultCourseForm);
      toast({ title: "Course updated", description: "Course has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update course", variant: "destructive" });
    },
  });

  const handleOpenCourseDialog = (course?: CourseWithStats) => {
    if (course) {
      setEditingCourse(course.id);
      setCourseForm({
        title: course.title,
        description: course.description || '',
        shortDescription: course.shortDescription || '',
        category: course.category || 'blockchain',
        difficulty: course.difficulty || 'beginner',
        duration: course.duration || 60,
        bmtReward: course.bmtReward,
        isPublished: course.isPublished,
      });
    } else {
      setEditingCourse(null);
      setCourseForm(defaultCourseForm);
    }
    setCourseDialogOpen(true);
  };

  const handleSaveCourse = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(formData);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
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

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses" data-testid="tab-courses">
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </TabsTrigger>
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

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>
                    Create, edit, and manage courses. Add quizzes and set $BMT rewards.
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenCourseDialog()} data-testid="button-create-course">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : courses && courses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id} data-testid={`row-course-manage-${course.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {course.shortDescription || course.description?.slice(0, 50)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.category || 'General'}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{course.difficulty || 'Beginner'}</TableCell>
                        <TableCell>{course.duration || 60} min</TableCell>
                        <TableCell className="text-right font-semibold">{course.bmtReward} $BMT</TableCell>
                        <TableCell>
                          {course.isPublished ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCourseDialog(course)}
                            data-testid={`button-edit-course-${course.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No courses yet</p>
                  <p className="text-sm">Create your first course to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update course details below.' : 'Fill in the details to create a new course.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  placeholder="e.g., Introduction to Blockchain"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-course-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-short-desc">Short Description</Label>
                <Input
                  id="course-short-desc"
                  placeholder="Brief summary for course cards"
                  value={courseForm.shortDescription}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                  data-testid="input-course-short-desc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-description">Full Description</Label>
                <Textarea
                  id="course-description"
                  placeholder="Detailed course description..."
                  rows={4}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-course-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-category">Category</Label>
                  <Select
                    value={courseForm.category}
                    onValueChange={(value) => setCourseForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger id="course-category" data-testid="select-course-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                      <SelectItem value="tokenomics">Tokenomics</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="defi">DeFi</SelectItem>
                      <SelectItem value="nft">NFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-difficulty">Difficulty</Label>
                  <Select
                    value={courseForm.difficulty}
                    onValueChange={(value) => setCourseForm(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger id="course-difficulty" data-testid="select-course-difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-duration">Duration (minutes)</Label>
                  <Input
                    id="course-duration"
                    type="number"
                    min="1"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    data-testid="input-course-duration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-reward">$BMT Reward</Label>
                  <Input
                    id="course-reward"
                    type="number"
                    min="0"
                    value={courseForm.bmtReward}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, bmtReward: parseInt(e.target.value) || 0 }))}
                    data-testid="input-course-reward"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Publish Course</Label>
                  <p className="text-xs text-muted-foreground">Make this course visible to students</p>
                </div>
                <Switch
                  checked={courseForm.isPublished}
                  onCheckedChange={(checked) => setCourseForm(prev => ({ ...prev, isPublished: checked }))}
                  data-testid="switch-course-published"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCourseDialogOpen(false)} data-testid="button-cancel-course">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCourse} 
                disabled={createCourseMutation.isPending || updateCourseMutation.isPending || !courseForm.title}
                data-testid="button-save-course"
              >
                {(createCourseMutation.isPending || updateCourseMutation.isPending) ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    {/* Network Status */}
                    {paymasterConfig.network && (
                      <div className={`flex items-center justify-between gap-2 p-3 rounded-lg ${paymasterConfig.network.network === 'testnet' ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${paymasterConfig.network.network === 'testnet' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                          <span className={`text-sm font-medium ${paymasterConfig.network.network === 'testnet' ? 'text-orange-600' : 'text-blue-600'}`}>
                            Kasplex {paymasterConfig.network.network === 'testnet' ? 'Testnet' : 'Mainnet'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">Chain ID: {paymasterConfig.network.chainId}</span>
                      </div>
                    )}

                    {/* Private Key Status */}
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${paymasterConfig.privateKeyConfigured ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                      {paymasterConfig.privateKeyConfigured ? (
                        <>
                          <Key className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-600">Private Key Configured</p>
                            <p className="text-xs text-muted-foreground">Ready for automated payouts</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium text-yellow-600">Private Key Not Set</p>
                            <p className="text-xs text-muted-foreground">Set PAYMASTER_PRIVATE_KEY secret for automated payouts</p>
                          </div>
                        </>
                      )}
                    </div>

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

          {/* Live Market Data Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Live Market Data
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchTokenData()}
                  disabled={tokenDataLoading || !paymasterConfig?.tokenContractAddress}
                  data-testid="button-refresh-market-data"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${tokenDataLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Real-time $BMT token data from Kaspacom DEX
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!paymasterConfig?.tokenContractAddress ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure token contract address to see market data</p>
                </div>
              ) : tokenDataLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : tokenData ? (
                <div className="space-y-4">
                  {/* Token Info Header */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{tokenData.name}</p>
                      <p className="text-sm text-muted-foreground">${tokenData.symbol}</p>
                    </div>
                  </div>

                  {/* Market Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <DollarSign className="w-5 h-5 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-600" data-testid="text-token-price">
                        ${tokenData.tokenPriceUSD < 0.01 
                          ? tokenData.tokenPriceUSD.toFixed(8) 
                          : tokenData.tokenPriceUSD.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">Price USD</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <TrendingUp className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-600" data-testid="text-market-cap">
                        ${tokenData.marketCapUSD >= 1000000 
                          ? (tokenData.marketCapUSD / 1000000).toFixed(2) + 'M'
                          : tokenData.marketCapUSD >= 1000 
                            ? (tokenData.marketCapUSD / 1000).toFixed(1) + 'K'
                            : tokenData.marketCapUSD.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <Users className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-purple-600" data-testid="text-holders">
                        {tokenData.holders.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Holders</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <Coins className="w-5 h-5 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold text-orange-600" data-testid="text-total-supply">
                        {Number(tokenData.totalSupply) >= 1000000000 
                          ? (Number(tokenData.totalSupply) / 1000000000).toFixed(1) + 'B'
                          : Number(tokenData.totalSupply) >= 1000000 
                            ? (Number(tokenData.totalSupply) / 1000000).toFixed(1) + 'M'
                            : Number(tokenData.totalSupply).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Supply</p>
                    </div>
                  </div>

                  {/* Contract Address */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Contract Address</p>
                    <a 
                      href={`https://explorer.kasplex.org/token/${tokenData.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                      data-testid="link-token-explorer"
                    >
                      {tokenData.id}
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : tokenDataError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-500">Failed to fetch market data</p>
                  <p className="text-xs">The Kaspacom DEX API may be temporarily unavailable</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => refetchTokenData()}
                    data-testid="button-retry-market-data"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No market data available</p>
                  <p className="text-xs">Enter a valid token contract address to see live data</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => processPayoutMutation.mutate(payout.id)}
                                disabled={processPayoutMutation.isPending || !paymasterConfig?.privateKeyConfigured}
                                title={!paymasterConfig?.privateKeyConfigured ? 'Set PAYMASTER_PRIVATE_KEY to enable' : 'Send tokens via blockchain'}
                                data-testid={`button-process-${payout.id}`}
                              >
                                <ArrowUpRight className="w-4 h-4 mr-1" />
                                Process
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completePayoutMutation.mutate({ payoutId: payout.id })}
                                disabled={completePayoutMutation.isPending}
                                data-testid={`button-complete-${payout.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Manual
                              </Button>
                            </div>
                          )}
                          {payout.status === 'processing' && (
                            <Badge variant="outline" className="animate-pulse">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Broadcasting...
                            </Badge>
                          )}
                          {payout.status === 'failed' && (
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => processPayoutMutation.mutate(payout.id)}
                                disabled={processPayoutMutation.isPending || !paymasterConfig?.privateKeyConfigured}
                                title={!paymasterConfig?.privateKeyConfigured ? 'Set PAYMASTER_PRIVATE_KEY to enable' : 'Retry blockchain transaction'}
                                data-testid={`button-retry-${payout.id}`}
                              >
                                Retry
                              </Button>
                              {payout.errorMessage && (
                                <p className="text-xs text-red-500 max-w-[200px] truncate" title={payout.errorMessage}>
                                  {payout.errorMessage}
                                </p>
                              )}
                            </div>
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
