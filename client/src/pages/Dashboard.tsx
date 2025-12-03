import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/StatsCard';
import CourseCard, { CourseDisplay } from '@/components/CourseCard';
import RewardHistory, { RewardTransaction } from '@/components/RewardHistory';
import CertificateModal, { Certificate } from '@/components/CertificateModal';
import { BookOpen, Award, Coins, Trophy, GraduationCap, Clock, Loader2, Wallet } from 'lucide-react';
import type { Course, Enrollment, Reward } from '@shared/schema';

function mapCourseToDisplay(course: Course, enrollment?: Enrollment): CourseDisplay {
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
    progress: enrollment?.progress ?? 0,
  };
}

const demoTransactions: RewardTransaction[] = [
  {
    id: '1',
    type: 'course_completion',
    courseName: 'Crypto Fundamentals',
    amount: 250,
    txHash: '0x8f7e6d5c4b3a2190f8e7d6c5b4a3f2e1d0c9b8a7',
    status: 'confirmed',
    date: 'Dec 3, 2025',
  },
  {
    id: '2',
    type: 'quiz_bonus',
    courseName: 'Perfect Score Bonus',
    amount: 50,
    txHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
    status: 'confirmed',
    date: 'Dec 3, 2025',
  },
  {
    id: '3',
    type: 'course_completion',
    courseName: 'Introduction to Mining',
    amount: 400,
    txHash: '0x9h8g7f6e5d4c3b2a1z0y9x8w7v6u5t4s',
    status: 'confirmed',
    date: 'Nov 28, 2025',
  },
];

const demoCertificates: Certificate[] = [
  {
    id: '1',
    courseName: 'Crypto Fundamentals',
    studentName: '0x7a3B...9f2C',
    completionDate: 'December 3, 2025',
    txHash: '0x8f7e6d5c4b3a2190f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a',
    reward: 250,
  },
];

interface DashboardEmptyStateProps {
  onExplore: () => void;
}

function DashboardEmptyState({ onExplore }: DashboardEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="p-4 rounded-full bg-kaspa-cyan/10 w-fit mx-auto mb-4">
        <Wallet className="w-12 h-12 text-kaspa-cyan" />
      </div>
      <h3 className="font-heading font-semibold text-xl text-white mb-2">Connect Your Wallet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Connect your Kaspa wallet to start learning, earn $BMT rewards, and track your progress.
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
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  const isWalletConnected = false;

  const { data: allCourses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const enrolledCourses: CourseDisplay[] = allCourses.slice(0, 3).map((course, idx) => 
    mapCourseToDisplay(course, { 
      id: `demo-${idx}`,
      userId: 'demo',
      courseId: course.id,
      progress: [75, 30, 100][idx] ?? 0,
      status: [75, 30, 100][idx] === 100 ? 'completed' : 'in_progress',
      completedLessons: [],
      enrolledAt: new Date(),
      completedAt: null,
    })
  );

  const completedCourses = enrolledCourses.filter(c => c.progress === 100);
  const inProgressCourses = enrolledCourses.filter(c => (c.progress ?? 0) < 100);
  const totalEarned = demoTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleViewCertificate = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setCertificateModalOpen(true);
  };

  const handleExplore = () => {
    window.location.href = '/courses';
  };

  if (coursesLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-dashboard">
        <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin" />
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
            value={demoCertificates.length.toString()}
            icon={Award}
            accentColor="orange"
          />
          <StatsCard
            title="$BMT Earned"
            value={totalEarned.toLocaleString()}
            icon={Coins}
            trend={{ value: '300', isPositive: true }}
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
                      onContinue={(id) => console.log('Continuing:', id)}
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
                      onContinue={(id) => console.log('Reviewing:', id)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoCertificates.map((cert) => (
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

            {demoCertificates.length === 0 && (
              <div className="text-center py-16">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl text-white mb-2">No certificates yet</h3>
                <p className="text-muted-foreground">Complete courses to earn certificates and $BMT rewards</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards">
            <RewardHistory transactions={demoTransactions} />
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
