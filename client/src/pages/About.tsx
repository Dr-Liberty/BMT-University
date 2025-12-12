import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, Clock, Target, Loader2 } from 'lucide-react';
import type { AboutPage, RoadmapItem } from '@shared/schema';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764823250369.jpg';
import bmtMeme2 from '@assets/photo_2025-12-02_21-30-02_1764741237227.jpg';
import bmtMeme3 from '@assets/photo_2025-12-02_21-30-25_1764741237226.jpg';
import Footer from '@/components/Footer';
import TokenStats from '@/components/TokenStats';

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const statusConfig = {
    'completed': { 
      icon: CheckCircle2, 
      color: 'text-kaspa-green', 
      bgColor: 'bg-kaspa-green/10',
      borderColor: 'border-kaspa-green/30',
      label: 'Completed'
    },
    'in-progress': { 
      icon: Clock, 
      color: 'text-bmt-orange', 
      bgColor: 'bg-bmt-orange/10',
      borderColor: 'border-bmt-orange/30',
      label: 'In Progress'
    },
    'planned': { 
      icon: Target, 
      color: 'text-kaspa-cyan', 
      bgColor: 'bg-kaspa-cyan/10',
      borderColor: 'border-kaspa-cyan/30',
      label: 'Planned'
    },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <Card className={`${config.borderColor} border-2 hover:scale-[1.02] transition-transform`} data-testid={`card-roadmap-${item.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
          <Badge className={`${config.bgColor} ${config.color} border-0`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        {item.targetDate && (
          <p className="text-sm text-muted-foreground">{item.targetDate}</p>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  );
}

export default function About() {
  const { data: aboutPage, isLoading, error } = useQuery<AboutPage>({
    queryKey: ['/api/about'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-about">
        <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin" />
      </div>
    );
  }

  if (error || !aboutPage) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="error-about">
        <p className="text-destructive">Failed to load about page content</p>
      </div>
    );
  }

  const paragraphs = aboutPage.description.split('\n\n').filter(p => p.trim());

  return (
    <div className="flex-1 flex flex-col" data-testid="page-about">
      <section className="pt-24 pb-16 px-4 sm:px-6 border-b border-border" data-testid="section-about-description">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <h1 className="font-heading font-bold text-4xl text-white">
                  About <span className="text-bmt-orange">$BMT</span>
                </h1>
              </div>
              
              {paragraphs.map((paragraph, index) => (
                <p 
                  key={index} 
                  className={`text-muted-foreground mb-4 ${index === 0 ? 'text-lg' : ''}`}
                  data-testid={`text-description-${index}`}
                >
                  {paragraph}
                </p>
              ))}

              <div className="flex flex-wrap gap-4 mt-8">
                <a 
                  href="https://lfg.kaspa.com/app/token/0x35fBa50F52e2AA305438134c646957066608d976"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="bg-bmt-orange text-background hover:bg-bmt-orange/90 gap-2"
                    data-testid="button-buy-bmt"
                  >
                    Buy $BMT
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <a 
                  href="https://explorer.kasplex.org/token/0x35fBa50F52e2AA305438134c646957066608d976"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="border-kaspa-cyan text-kaspa-cyan hover:bg-kaspa-cyan/10 gap-2"
                    data-testid="button-view-kasplex"
                  >
                    View on Kasplex
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="col-span-2 overflow-hidden border-bmt-orange/30 hover:border-bmt-orange transition-colors">
                <CardContent className="p-0">
                  <img 
                    src={bmtMeme2} 
                    alt="BMT Meme" 
                    className="w-full h-64 object-cover"
                    data-testid="img-bmt-meme-1"
                  />
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-kaspa-cyan/30 hover:border-kaspa-cyan transition-colors">
                <CardContent className="p-0">
                  <img 
                    src={bmtLogo} 
                    alt="BMT Logo" 
                    className="w-full h-40 object-cover"
                    data-testid="img-bmt-meme-2"
                  />
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-kaspa-green/30 hover:border-kaspa-green transition-colors">
                <CardContent className="p-0">
                  <img 
                    src={bmtMeme3} 
                    alt="BMT Hero" 
                    className="w-full h-40 object-cover"
                    data-testid="img-bmt-meme-3"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <TokenStats />

      <section className="py-16 px-4 sm:px-6" data-testid="section-roadmap">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl text-white mb-4">
              <span className="text-kaspa-cyan">Roadmap</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our journey to revolutionize crypto education on the Kaspa blockchain
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {aboutPage.roadmap.map((item) => (
              <RoadmapCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
