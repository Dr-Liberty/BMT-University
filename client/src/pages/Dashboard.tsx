import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/StatsCard';
import CourseCard, { CourseDisplay } from '@/components/CourseCard';
import RewardHistory, { RewardTransaction } from '@/components/RewardHistory';
import CertificateModal, { Certificate } from '@/components/CertificateModal';
import { BookOpen, Award, Coins, Trophy, GraduationCap, Clock, Loader2, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import type { Course, Enrollment, Reward, Certificate as CertificateType } from '@shared/schema';

interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
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
    progress: enrollment.progress ?? 0,
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

  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError, refetch: refetchEnrollments } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ['/api/enrollments'],
    retry: false,
  });

  const { data: allCourses = [] } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

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

  const completedCourses = enrolledCourses.filter(c => c.progress === 100);
  const inProgressCourses = enrolledCourses.filter(c => (c.progress ?? 0) < 100);
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
          <TabsList className="bg-muted">
            <TabsTrigger value="courses" className="gap-2" data-testid="tab-my-courses">
              <BookOpen className="w-4 h-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2" data-testid="tab-certificates">
              <Award className="w-4 h-4" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2" data-testid="tab-rewards">
              <Coins className="w-4 h-4" />
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
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
