import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Award, Coins, CheckCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764823250369.jpg';

interface StatsData {
  totalCourses: number;
  totalStudents: number;
  coursesCompleted: number;
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
  const { t } = useTranslation();
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
          {t('hero.title')} <span className="text-kaspa-cyan">{t('hero.titleHighlight')}</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground font-heading mb-8" data-testid="text-hero-subtitle">
          {t('hero.subtitle')} <span className="text-bmt-orange">{t('hero.subtitleHighlight')}</span>
        </p>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          {t('hero.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/courses">
            <Button
              size="lg"
              className="bg-gradient-to-r from-kaspa-cyan to-kaspa-green text-background font-heading uppercase tracking-wide px-8 gap-2"
              data-testid="button-hero-explore"
            >
              <BookOpen className="w-5 h-5" />
              {t('hero.exploreCourses')}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-gradient-to-r from-kaspa-cyan to-kaspa-green text-background font-heading uppercase tracking-wide px-8 gap-2"
              data-testid="button-hero-dashboard"
            >
              <Award className="w-5 h-5" />
              {t('hero.dashboard')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-16 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-lg mx-auto" data-testid="notice-vpn-warning">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-200">
            <span className="font-semibold">{t('hero.important')}</span> {t('hero.vpnWarning')}
          </p>
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
            <span className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.courses')}</span>
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
            <span className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.students')}</span>
          </div>
          
          <div className="text-center" data-testid="stat-hero-courses-completed">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-kaspa-cyan mr-2" />
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <span className="font-heading font-bold text-3xl text-white">{stats?.coursesCompleted?.toLocaleString() ?? 0}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.coursesCompleted')}</span>
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
            <span className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.bmtDistributed')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
