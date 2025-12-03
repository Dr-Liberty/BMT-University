import { Button } from '@/components/ui/button';
import { Wallet, BookOpen, Award, Coins } from 'lucide-react';
import bmtLogo from '@assets/Gemini_Generated_Image_a36drsa36drsa36d_1764781999555.png';

interface HeroStat {
  icon: typeof Wallet;
  value: string;
  label: string;
}

// todo: remove mock functionality
const heroStats: HeroStat[] = [
  { icon: BookOpen, value: '24', label: 'Courses' },
  { icon: Award, value: '1,247', label: 'Students' },
  { icon: Coins, value: '2.4M', label: '$BMT Distributed' },
];

interface HeroSectionProps {
  onConnectWallet?: () => void;
}

export default function HeroSection({ onConnectWallet }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16" data-testid="section-hero">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
        <div className="mb-8 inline-block">
          <img
            src={bmtLogo}
            alt="BMT Logo"
            className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_25px_rgba(0,212,255,0.3)] mx-auto"
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            onClick={onConnectWallet}
            className="bg-gradient-to-r from-kaspa-cyan to-kaspa-green text-background font-heading uppercase tracking-wide px-8 gap-2"
            data-testid="button-hero-connect"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-bmt-orange text-bmt-orange hover:bg-bmt-orange/10 font-heading uppercase tracking-wide px-8"
            data-testid="button-hero-explore"
          >
            Explore Courses
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {heroStats.map((stat, index) => (
            <div key={index} className="text-center" data-testid={`stat-hero-${stat.label.toLowerCase().replace(' ', '-')}`}>
              <div className="flex items-center justify-center mb-2">
                <stat.icon className="w-6 h-6 text-kaspa-cyan mr-2" />
                <span className="font-heading font-bold text-3xl text-white">{stat.value}</span>
              </div>
              <span className="text-sm text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
