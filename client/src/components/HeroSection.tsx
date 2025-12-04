import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Award, Coins } from 'lucide-react';
import { Link } from 'wouter';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764822949579.jpg';

interface StatsData {
  totalCourses: number;
  totalStudents: number;
  totalBmtDistributed: number;
}

function formatBmtAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

export default function HeroSection() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['/api/stats'],
  });
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16" data-testid="section-hero">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
        <div className="mb-8 inline-block">
          <img
            src={bmtLogo}
            alt="BMT Logo"
            className="w-40 h-40 md:w-52 md:h-52 rounded-full object-cover border-[3px] border-[#E8D5B0] shadow-lg shadow-[#E8D5B0]/30 mx-auto"
            data-testid="img-hero-logo"
          />
        </div>

        <h1 className="font-heading font-bold text-5xl md:text-7xl text-white mb-4 tracking-tight" data-testid="text-hero-title">
          BMT <span className="text-kaspa-cyan">UNIVERSITY</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground font-heading mb-8" data-testid="text-hero-subtitle">
          Learn. Earn. <span className="text-bmt-orange">Collect Tears.</span>
        </p>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Master blockchain & crypto through expert-led courses. 
          Complete lessons, pass quizzes, and earn <span className="text-bmt-orange font-semibold">$BMT tokens</span> on the Kaspa network.
        </p>

        <div className="flex items-center justify-center mb-16">
          <Link href="/courses">
            <Button
              size="lg"
              className="bg-gradient-to-r from-kaspa-cyan to-kaspa-green text-background font-heading uppercase tracking-wide px-8 gap-2"
              data-testid="button-hero-explore"
            >
              <BookOpen className="w-5 h-5" />
              Explore Courses
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="text-center" data-testid="stat-hero-courses">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-kaspa-cyan mr-2" />
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <span className="font-heading font-bold text-3xl text-white">{stats?.totalCourses ?? 0}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground uppercase tracking-wide">Courses</span>
          </div>
          
          <div className="text-center" data-testid="stat-hero-students">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-kaspa-cyan mr-2" />
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <span className="font-heading font-bold text-3xl text-white">{stats?.totalStudents?.toLocaleString() ?? 0}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground uppercase tracking-wide">Students</span>
          </div>
          
          <div className="text-center" data-testid="stat-hero-bmt-distributed">
            <div className="flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-kaspa-cyan mr-2" />
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <span className="font-heading font-bold text-3xl text-white">{formatBmtAmount(stats?.totalBmtDistributed ?? 0)}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground uppercase tracking-wide">$BMT Distributed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
