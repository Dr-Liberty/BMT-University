import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import bmtMeme1 from '@assets/BMT_Meme_1_1764741215718.jpg';
import bmtMeme2 from '@assets/photo_2025-12-02_21-30-02_1764741237227.jpg';
import bmtMeme3 from '@assets/photo_2025-12-02_21-30-25_1764741237226.jpg';

export default function AboutBMT() {
  return (
    <section className="py-16 px-4 sm:px-6" data-testid="section-about-bmt">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-bold text-3xl text-white mb-4">
              What is <span className="text-bmt-orange">$BMT</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Bitcoin Maxi Tears ($BMT) is the ultimate meme token on the Kaspa blockchain, 
              launched on Kasplex. Every time a Bitcoin maximalist dismisses Kaspa's superior 
              technology, we collect their tears and turn them into tokens.
            </p>
            <p className="text-muted-foreground mb-6">
              Built on the fastest proof-of-work blockchain, $BMT combines the power of meme 
              culture with the revolutionary blockDAG technology of Kaspa. Learn, earn, and 
              collect tears with BMT University!
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                className="bg-bmt-orange text-background hover:bg-bmt-orange/90 gap-2"
                data-testid="button-buy-bmt"
              >
                Buy $BMT
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="border-kaspa-cyan text-kaspa-cyan hover:bg-kaspa-cyan/10 gap-2"
                data-testid="button-view-kasplex"
              >
                View on Kasplex
                <ExternalLink className="w-4 h-4" />
              </Button>
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
                  src={bmtMeme1} 
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
  );
}
