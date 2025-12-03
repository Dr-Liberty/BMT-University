import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, ExternalLink, Award } from 'lucide-react';
import bmtLogo from '@assets/unnamed_1764742650253.jpg';

export interface Certificate {
  id: string;
  courseName: string;
  studentName: string;
  completionDate: string;
  txHash: string;
  reward: number;
}

interface CertificateModalProps {
  certificate: Certificate | null;
  open: boolean;
  onClose: () => void;
}

export default function CertificateModal({ certificate, open, onClose }: CertificateModalProps) {
  if (!certificate) return null;

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
                className="w-20 h-20 rounded-full border-4 border-kaspa-cyan"
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

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Issued on {certificate.completionDate}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                <span>TX:</span>
                <span className="text-kaspa-cyan">{certificate.txHash.slice(0, 20)}...</span>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <Button variant="outline" className="gap-2" data-testid="button-download-certificate">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button className="gap-2 bg-kaspa-cyan text-background" data-testid="button-share-certificate">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
