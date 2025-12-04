import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, ExternalLink, Award, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764822949579.jpg';

export interface Certificate {
  id: string;
  courseName: string;
  studentName: string;
  completionDate: string;
  txHash?: string;
  reward: number;
  verificationCode?: string;
}

interface CertificateModalProps {
  certificate: Certificate | null;
  open: boolean;
  onClose: () => void;
}

export default function CertificateModal({ certificate, open, onClose }: CertificateModalProps) {
  const { toast } = useToast();

  if (!certificate) return null;

  const verificationUrl = certificate.verificationCode 
    ? `${window.location.origin}/verify/${certificate.verificationCode}`
    : null;

  const handleCopyLink = async () => {
    if (!verificationUrl) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(verificationUrl);
        toast({
          title: 'Link Copied',
          description: 'Verification link copied to clipboard',
        });
      } else {
        toast({
          title: 'Copy Not Supported',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Please copy the URL manually',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!verificationUrl) {
      handleCopyLink();
      return;
    }
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `BMT University Certificate - ${certificate.courseName}`,
          text: `I just completed "${certificate.courseName}" on BMT University and earned ${certificate.reward} $BMT!`,
          url: verificationUrl,
        });
      } else {
        handleCopyLink();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        handleCopyLink();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-2 border-kaspa-cyan/50" data-testid="modal-certificate">
        <DialogHeader>
          <DialogTitle className="sr-only">Certificate of Completion</DialogTitle>
        </DialogHeader>

        <div className="relative p-8 bg-gradient-to-br from-background via-card to-background rounded-lg border border-border">
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyNSAxMEwzNSAxMEwzMCAyMEwzNSAzMEwyNSAzMEwyMCA0MEwxNSAzMEw1IDMwTDEwIDIwTDUgMTBMMTUgMTBaIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEQ0RkYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]" />
          
          <div className="relative text-center">
            <div className="flex justify-center mb-6">
              <img
                src={bmtLogo}
                alt="BMT University"
                className="w-20 h-20 rounded-full border-[3px] border-[#E8D5B0]"
              />
            </div>

            <Badge className="mb-4 bg-kaspa-cyan/20 text-kaspa-cyan border-kaspa-cyan/30">
              <Award className="w-4 h-4 mr-1" />
              Certificate of Completion
            </Badge>

            <h2 className="font-heading font-bold text-3xl text-white mb-2">
              BMT UNIVERSITY
            </h2>

            <p className="text-muted-foreground mb-8">This certifies that</p>

            <p className="font-heading font-bold text-2xl text-kaspa-cyan mb-2" data-testid="text-certificate-student">
              {certificate.studentName}
            </p>

            <p className="text-muted-foreground mb-4">has successfully completed</p>

            <p className="font-heading font-semibold text-xl text-white mb-6" data-testid="text-certificate-course">
              {certificate.courseName}
            </p>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-muted-foreground">Reward:</span>
              <span className="font-heading font-bold text-bmt-orange">{certificate.reward.toLocaleString()} $BMT</span>
            </div>

            <div className="pt-6 border-t border-border space-y-3">
              <p className="text-sm text-muted-foreground">
                Issued on {certificate.completionDate}
              </p>
              
              {certificate.verificationCode && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>Verification Code:</span>
                  <span className="text-kaspa-cyan" data-testid="text-verification-code">{certificate.verificationCode}</span>
                </div>
              )}
              
              {certificate.txHash && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>TX:</span>
                  <span className="text-kaspa-cyan">{certificate.txHash.slice(0, 20)}...</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-5 w-5"
                    onClick={() => window.open(`https://explorer.kaspa.org/tx/${certificate.txHash}`, '_blank')}
                    data-testid="button-view-tx"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {verificationUrl && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleCopyLink}
              data-testid="button-copy-verification-link"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          )}
          <Button 
            variant="outline" 
            className="gap-2" 
            data-testid="button-download-certificate"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button 
            className="gap-2 bg-kaspa-cyan text-background hover:bg-kaspa-cyan/90" 
            onClick={handleShare}
            data-testid="button-share-certificate"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
