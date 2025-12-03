import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/StatsCard';
import CourseCard, { Course } from '@/components/CourseCard';
import RewardHistory, { RewardTransaction } from '@/components/RewardHistory';
import CertificateModal, { Certificate } from '@/components/CertificateModal';
import { BookOpen, Award, Coins, Trophy, GraduationCap, Clock } from 'lucide-react';

// todo: remove mock functionality
const enrolledCourses: (Course & { progress: number })[] = [
  {
    id: '1',
    title: 'Introduction to Kaspa Blockchain',
    description: 'Master the fundamentals of the Kaspa blockDAG architecture.',
    instructor: 'Shai Wyborski',
    duration: '4h 30m',
    students: 1247,
    rating: 4.9,
    price: 500,
    difficulty: 'Beginner',
    category: 'Blockchain',
    progress: 75,
  },
  {
    id: '3',
    title: 'DeFi Trading Strategies',
    description: 'Learn proven trading strategies for decentralized finance.',
    instructor: 'Whale Watcher',
    duration: '3h 45m',
    students: 2134,
    rating: 4.6,
    price: 750,
    difficulty: 'Intermediate',
    category: 'Trading',
    progress: 30,
  },
  {
    id: '5',
    title: 'Crypto Fundamentals',
    description: 'Everything you need to know about cryptocurrency.',
    instructor: 'Crypto Chad',
    duration: '2h 30m',
    students: 3421,
    rating: 4.5,
    price: 250,
    difficulty: 'Beginner',
    category: 'Fundamentals',
    progress: 100,
  },
];

const completedCourses = enrolledCourses.filter(c => c.progress === 100);

const transactions: RewardTransaction[] = [
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

const certificates: Certificate[] = [
  {
    id: '1',
    courseName: 'Crypto Fundamentals',
    studentName: '0x7a3B...9f2C',
    completionDate: 'December 3, 2025',
    txHash: '0x8f7e6d5c4b3a2190f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a',
    reward: 250,
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

  const totalEarned = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const inProgressCourses = enrolledCourses.filter(c => c.progress < 100);

  const handleViewCertificate = (cert: Certificate) => {
    setSelectedCertificate(cert);
    setCertificateModalOpen(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl text-white mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your learning progress and rewards</p>
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
            value={certificates.length.toString()}
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
          </TabsContent>

          <TabsContent value="certificates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
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

            {certificates.length === 0 && (
              <div className="text-center py-16">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl text-white mb-2">No certificates yet</h3>
                <p className="text-muted-foreground">Complete courses to earn certificates and $BMT rewards</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards">
            <RewardHistory transactions={transactions} />
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
