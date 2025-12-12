import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import StatsCard from '@/components/StatsCard';
import CourseCard, { CourseDisplay } from '@/components/CourseCard';
import RewardHistory, { RewardTransaction } from '@/components/RewardHistory';
import CertificateModal, { Certificate } from '@/components/CertificateModal';
import { BookOpen, Award, Coins, Trophy, GraduationCap, Clock, Loader2, Wallet, AlertCircle, RefreshCw, Users, Share2, Copy, Check, Gift, PlusCircle, RotateCcw } from 'lucide-react';
import type { Course, Enrollment, Reward, Certificate as CertificateType, ReferralCode, Referral } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  qualifiedReferrals: number;
  rewardedReferrals: number;
  totalBmtEarned: number;
}

interface ReferralSettings {
  isEnabled: boolean;
  referrerRewardAmount: number;
  refereeRewardAmount: number;
  triggerAction: string;
}

interface ReferralCodeWithLink extends ReferralCode {
  shareLink: string;
}

interface ReferralWithUser extends Referral {
  referredUser?: {
    displayName: string | null;
    walletAddress: string;
  };
}

interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
  quizPassed?: boolean;
  hasFailedAttempt?: boolean;
  failedAttemptCount?: number;
}

interface CertificateWithCourse extends CertificateType {
  course?: Course;
}

function mapEnrollmentToDisplay(enrollment: EnrollmentWithCourse): CourseDisplay | null {
  if (!enrollment.course) return null;
  const course = enrollment.course;
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnail: course.thumbnail,
    category: course.category,
    difficulty: course.difficulty,
    duration: course.duration,
    enrollmentCount: course.enrollmentCount,
    rating: course.rating,
    bmtReward: course.bmtReward,
    progress: Number(enrollment.progress ?? 0),
    quizPassed: enrollment.quizPassed,
    hasFailedAttempt: enrollment.hasFailedAttempt,
    failedAttemptCount: enrollment.failedAttemptCount,
  };
}

function mapRewardToTransaction(reward: Reward, courses: Course[]): RewardTransaction {
  const course = courses.find(c => c.id === reward.courseId);
  return {
    id: reward.id,
    type: reward.type === 'course_completion' ? 'course_completion' : 'quiz_bonus',
    courseName: course?.title || 'Unknown Course',
    amount: reward.amount,
    txHash: reward.txHash || undefined,
    status: reward.status === 'confirmed' ? 'confirmed' : reward.status === 'pending' ? 'pending' : 'failed',
    date: reward.createdAt ? new Date(reward.createdAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) : 'Unknown',
  };
}

interface DashboardEmptyStateProps {
  onExplore: () => void;
}

function DashboardEmptyState({ onExplore }: DashboardEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="p-4 rounded-full bg-kaspa-cyan/10 w-fit mx-auto mb-4">
        <Wallet className="w-12 h-12 text-kaspa-cyan" />
      </div>
      <h3 className="font-heading font-semibold text-xl text-white mb-2">No Enrolled Courses</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Start your learning journey by enrolling in courses and earning $BMT rewards.
      </p>
      <Button 
        onClick={onExplore}
        className="bg-bmt-orange text-background hover:bg-bmt-orange/90"
      >
        Explore Courses
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const { toast } = useToast();

  // Check for referral code in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCodeInput(refCode);
      setActiveTab('referrals');
      // Store in localStorage for after wallet connection
      localStorage.setItem('pendingReferralCode', refCode);
    }
  }, []);

  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError, refetch: refetchEnrollments } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ['/api/enrollments'],
    retry: false,
  });
  
  const { data: referralCode } = useQuery<ReferralCodeWithLink>({
    queryKey: ['/api/referrals/my-code'],
    retry: false,
  });
  
  const { data: referralStats, refetch: refetchReferralStats } = useQuery<ReferralStats>({
    queryKey: ['/api/referrals/stats'],
    retry: false,
  });
  
  const { data: referralSettings } = useQuery<ReferralSettings>({
    queryKey: ['/api/referrals/settings'],
  });
  
  const { data: referralsList = [], refetch: refetchReferralsList } = useQuery<ReferralWithUser[]>({
    queryKey: ['/api/referrals/list'],
    retry: false,
  });
  
  const { data: myReferrer } = useQuery<Referral | null>({
    queryKey: ['/api/referrals/my-referrer'],
    retry: false,
  });
  
  const applyReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('POST', '/api/referrals/apply', { code });
    },
    onSuccess: () => {
      toast({ title: 'Referral applied!', description: 'You have successfully been referred!' });
      setReferralCodeInput('');
      localStorage.removeItem('pendingReferralCode');
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-referrer'] });
      refetchReferralStats();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to apply referral', 
        description: error.message || 'Could not apply referral code', 
        variant: 'destructive' 
      });
    },
  });
  
  const handleApplyReferral = () => {
    if (referralCodeInput.trim()) {
      applyReferralMutation.mutate(referralCodeInput.trim());
    }
  };

  const { data: coursesResponse } = useQuery<{ courses: Course[]; pagination: { limit: number; offset: number; hasMore: boolean } }>({
    queryKey: ['/api/courses'],
  });
  
  const allCourses = coursesResponse?.courses ?? [];

  const { data: certificates = [], isLoading: certificatesLoading } = useQuery<CertificateWithCourse[]>({
    queryKey: ['/api/certificates'],
    retry: false,
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
    retry: false,
  });

  const enrolledCourses: CourseDisplay[] = enrollments
    .map(mapEnrollmentToDisplay)
    .filter((c): c is CourseDisplay => c !== null);

  const completedCourses = enrolledCourses.filter(c => c.quizPassed === true || Number(c.progress ?? 0) >= 100);
  const needsRetryCourses = enrolledCourses.filter(c => c.hasFailedAttempt === true && c.quizPassed !== true);
  const inProgressCourses = enrolledCourses.filter(c => c.quizPassed !== true && Number(c.progress ?? 0) < 100 && !c.hasFailedAttempt);
  const totalEarned = rewards.reduce((sum, r) => sum + r.amount, 0);

  const rewardTransactions: RewardTransaction[] = rewards.map(r => mapRewardToTransaction(r, allCourses));

  const displayCertificates: Certificate[] = certificates.map(cert => ({
    id: cert.id,
    courseName: cert.course?.title || 'Unknown Course',
    studentName: cert.id.slice(0, 8),
    completionDate: cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) : 'Unknown',
    txHash: cert.txHash || undefined,
    reward: cert.course?.bmtReward || 0,
    verificationCode: cert.verificationCode || undefined,
  }));

  const handleViewCertificate = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setCertificateModalOpen(true);
  };

  const handleExplore = () => {
    setLocation('/courses');
  };

  const handleContinue = (courseId: string) => {
    setLocation(`/course/${courseId}`);
  };

  const handleCopyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCodeCopied(true);
      toast({ title: 'Code copied!', description: 'Referral code copied to clipboard' });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (referralCode?.shareLink) {
      navigator.clipboard.writeText(referralCode.shareLink);
      setLinkCopied(true);
      toast({ title: 'Link copied!', description: 'Share link copied to clipboard' });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const isLoading = enrollmentsLoading;
  const isUnauthenticated = enrollmentsError && !enrollmentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-dashboard">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (isUnauthenticated) {
    return (
      <div className="min-h-screen pt-20 pb-8" data-testid="page-dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-4xl text-white mb-2">Student Dashboard</h1>
            <p className="text-muted-foreground">Track your learning progress and $BMT rewards</p>
          </div>
          
          <div className="text-center py-16">
            <div className="p-4 rounded-full bg-kaspa-cyan/10 w-fit mx-auto mb-4">
              <Wallet className="w-12 h-12 text-kaspa-cyan" />
            </div>
            <h3 className="font-heading font-semibold text-xl text-white mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Kaspa wallet to view your enrolled courses, certificates, and $BMT rewards.
            </p>
            <Button 
              onClick={handleExplore}
              className="bg-bmt-orange text-background hover:bg-bmt-orange/90"
            >
              Explore Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl text-white mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your learning progress and $BMT rewards</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Courses Enrolled"
            value={enrolledCourses.length.toString()}
            subtitle={`${inProgressCourses.length} in progress`}
            icon={BookOpen}
            accentColor="cyan"
          />
          <StatsCard
            title="Completed"
            value={completedCourses.length.toString()}
            icon={GraduationCap}
            accentColor="green"
          />
          <StatsCard
            title="Certificates"
            value={displayCertificates.length.toString()}
            icon={Award}
            accentColor="orange"
          />
          <StatsCard
            title="$BMT Earned"
            value={totalEarned.toLocaleString()}
            icon={Coins}
            trend={totalEarned > 0 ? { value: totalEarned.toString(), isPositive: true } : undefined}
            accentColor="orange"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted inline-flex min-w-max">
              <TabsTrigger value="courses" className="gap-2" data-testid="tab-my-courses">
                <BookOpen className="w-4 h-4" />
                <span><span className="hidden sm:inline">My </span>Courses</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="gap-2" data-testid="tab-certificates">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Certificates</span>
                <span className="sm:hidden">Certs</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-2" data-testid="tab-rewards">
                <Coins className="w-4 h-4" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2" data-testid="tab-referrals">
                <Users className="w-4 h-4" />
                Referrals
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="courses" className="space-y-6">
            {needsRetryCourses.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-xl text-white mb-4 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-bmt-orange" />
                  Needs Retry
                  <Badge variant="secondary" className="ml-2">{needsRetryCourses.length}</Badge>
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  These courses have quiz attempts that didn't pass. Review the material and try again!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {needsRetryCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolled
                      onContinue={handleContinue}
                    />
                  ))}
                </div>
              </div>
            )}

            {inProgressCourses.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-xl text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-kaspa-cyan" />
                  In Progress
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolled
                      onContinue={handleContinue}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedCourses.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-xl text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-kaspa-green" />
                  Completed
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolled
                      onContinue={handleContinue}
                    />
                  ))}
                </div>
              </div>
            )}

            {enrolledCourses.length === 0 && (
              <DashboardEmptyState onExplore={handleExplore} />
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {certificatesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin" />
              </div>
            ) : displayCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-card border border-border rounded-lg p-6 hover:border-kaspa-cyan/50 transition-colors cursor-pointer"
                    onClick={() => handleViewCertificate(cert)}
                    data-testid={`card-certificate-${cert.id}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-bmt-orange/20">
                        <Award className="w-6 h-6 text-bmt-orange" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{cert.courseName}</p>
                        <p className="text-sm text-muted-foreground">{cert.completionDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reward: <span className="text-bmt-orange font-semibold">{cert.reward} $BMT</span></span>
                      <Button size="sm" variant="outline" className="text-kaspa-cyan border-kaspa-cyan/30">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl text-white mb-2">No certificates yet</h3>
                <p className="text-muted-foreground">Complete courses to earn certificates and $BMT rewards</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards">
            {rewardsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin" />
              </div>
            ) : rewardTransactions.length > 0 ? (
              <RewardHistory transactions={rewardTransactions} />
            ) : (
              <div className="text-center py-16">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl text-white mb-2">No rewards yet</h3>
                <p className="text-muted-foreground">Complete courses to start earning $BMT tokens</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            {referralSettings?.isEnabled ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 border-kaspa-cyan/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Share2 className="w-5 h-5 text-kaspa-cyan" />
                        Share Your Referral Link
                      </CardTitle>
                      <CardDescription>
                        Invite friends to BMT University and earn {referralSettings.referrerRewardAmount} $BMT for each successful referral!
                        {referralSettings.triggerAction === 'enrollment' 
                          ? ' They earn rewards when they enroll in a course.'
                          : ' They earn rewards when they complete a course.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Your Referral Code</label>
                        <div className="flex gap-2">
                          <Input 
                            value={referralCode?.code || 'Loading...'} 
                            readOnly 
                            className="font-mono text-lg bg-muted"
                            data-testid="input-referral-code"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleCopyCode}
                            data-testid="button-copy-code"
                          >
                            {codeCopied ? <Check className="w-4 h-4 text-kaspa-green" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Share Link</label>
                        <div className="flex gap-2">
                          <Input 
                            value={referralCode?.shareLink || 'Loading...'} 
                            readOnly 
                            className="text-sm bg-muted"
                            data-testid="input-share-link"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleCopyLink}
                            data-testid="button-copy-link"
                          >
                            {linkCopied ? <Check className="w-4 h-4 text-kaspa-green" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 pt-2">
                        <Badge variant="secondary" className="gap-1">
                          <Gift className="w-3 h-3" />
                          You earn: {referralSettings.referrerRewardAmount} $BMT
                        </Badge>
                        <Badge variant="outline" className="gap-1 border-kaspa-cyan/30 text-kaspa-cyan">
                          <Gift className="w-3 h-3" />
                          Friend earns: {referralSettings.refereeRewardAmount} $BMT
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-bmt-orange/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Trophy className="w-5 h-5 text-bmt-orange" />
                        Your Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Total Referrals</span>
                        <span className="font-semibold text-white">{referralStats?.totalReferrals || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Pending</span>
                        <Badge variant="secondary">{referralStats?.pendingReferrals || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Rewarded</span>
                        <Badge className="bg-kaspa-green/20 text-kaspa-green">{referralStats?.rewardedReferrals || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">$BMT Earned</span>
                        <span className="font-bold text-bmt-orange">{referralStats?.totalBmtEarned?.toLocaleString() || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {!myReferrer && (
                  <Card className="border-dashed border-2 border-muted-foreground/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <PlusCircle className="w-5 h-5 text-kaspa-cyan" />
                        Have a Referral Code?
                      </CardTitle>
                      <CardDescription>
                        Enter a friend's referral code to get a {referralSettings?.refereeRewardAmount || 0} $BMT bonus when you {referralSettings?.triggerAction === 'enrollment' ? 'enroll in your first course' : 'complete your first course'}!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter referral code"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                          className="font-mono"
                          data-testid="input-apply-referral"
                        />
                        <Button
                          onClick={handleApplyReferral}
                          disabled={!referralCodeInput.trim() || applyReferralMutation.isPending}
                          data-testid="button-apply-referral"
                        >
                          {applyReferralMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {myReferrer && (
                  <Card className="border-kaspa-green/30 bg-kaspa-green/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-kaspa-green/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-kaspa-green" />
                        </div>
                        <div>
                          <p className="font-medium text-white">You were referred!</p>
                          <p className="text-sm text-muted-foreground">
                            {myReferrer.status === 'rewarded' 
                              ? 'Your referral bonus has been awarded!'
                              : myReferrer.status === 'qualified'
                              ? 'Your referral bonus is being processed...'
                              : `Complete your first ${referralSettings?.triggerAction === 'enrollment' ? 'enrollment' : 'course'} to unlock your bonus!`
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {referralsList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Users className="w-5 h-5 text-kaspa-cyan" />
                        Your Referrals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {referralsList.map((referral) => (
                          <div 
                            key={referral.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            data-testid={`referral-item-${referral.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-kaspa-cyan/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-kaspa-cyan" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {referral.referredUser?.displayName || referral.referredUser?.walletAddress || 'Anonymous User'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={referral.status === 'rewarded' ? 'default' : 'secondary'}
                              className={referral.status === 'rewarded' ? 'bg-kaspa-green/20 text-kaspa-green' : ''}
                            >
                              {referral.status === 'rewarded' ? 'Rewarded' : referral.status === 'qualified' ? 'Qualified' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {referralsList.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No referrals yet. Share your link to start earning!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl text-white mb-2">Referral Program Unavailable</h3>
                <p className="text-muted-foreground">The referral program is currently not active. Check back later!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CertificateModal
        certificate={selectedCertificate}
        open={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
      />
    </div>
  );
}
