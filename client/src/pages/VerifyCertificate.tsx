import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle2, XCircle, ExternalLink, Loader2, Copy, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764823250369.jpg';

interface VerifiedCertificate {
  valid: boolean;
  certificate?: {
    id: string;
    courseName: string;
    studentName?: string;
    studentWallet?: string;
    txHash?: string;
    issuedAt: string;
    verificationCode: string;
  };
}

export default function VerifyCertificate() {
  const params = useParams();
  const code = params.code || '';
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<VerifiedCertificate>({
    queryKey: ['/api/certificates/verify', code],
    enabled: !!code,
  });

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Certificate verification link copied to clipboard',
        });
      } else {
        toast({
          title: 'Copy Not Supported',
          description: 'Please copy the URL from your browser address bar',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Please copy the URL from your browser address bar',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-8 flex items-center justify-center" data-testid="page-verify-certificate">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-kaspa-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.valid) {
    return (
      <div className="min-h-screen pt-20 pb-8" data-testid="page-verify-certificate">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <Card className="bg-card border-destructive/50">
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-destructive/20 w-fit mx-auto mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h1 className="font-heading font-bold text-2xl text-white mb-2">
                Certificate Not Found
              </h1>
              <p className="text-muted-foreground mb-6">
                This certificate could not be verified. It may not exist or the verification code may be incorrect.
              </p>
              <Button 
                onClick={() => setLocation('/')}
                className="bg-bmt-orange text-background hover:bg-bmt-orange/90"
                data-testid="button-back-home-error"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const cert = data.certificate!;
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen pt-20 pb-8" data-testid="page-verify-certificate">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6 text-center">
          <Badge className="bg-kaspa-green/20 text-kaspa-green border-kaspa-green/30">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Verified Certificate
          </Badge>
        </div>

        <Card className="bg-card border-2 border-kaspa-cyan/50">
          <CardContent className="p-8">
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

                <p className="font-heading font-bold text-2xl text-kaspa-cyan mb-2" data-testid="text-verified-student">
                  {cert.studentName || cert.studentWallet?.slice(0, 12) + '...' || 'Anonymous'}
                </p>

                {cert.studentWallet && (
                  <p className="text-sm font-mono text-muted-foreground mb-4" data-testid="text-verified-wallet">
                    {cert.studentWallet.slice(0, 16)}...{cert.studentWallet.slice(-8)}
                  </p>
                )}

                <p className="text-muted-foreground mb-4">has successfully completed</p>

                <p className="font-heading font-semibold text-xl text-white mb-8" data-testid="text-verified-course">
                  {cert.courseName}
                </p>

                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    Issued on {issuedDate}
                  </p>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>Verification Code:</span>
                      <span className="text-kaspa-cyan" data-testid="text-verification-code">{cert.verificationCode}</span>
                    </div>
                    
                    {cert.txHash && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span>TX:</span>
                        <span className="text-kaspa-cyan">{cert.txHash.slice(0, 20)}...</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-5 w-5"
                          onClick={() => window.open(`https://explorer.kaspa.org/tx/${cert.txHash}`, '_blank')}
                          data-testid="button-view-tx"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleCopyLink}
                data-testid="button-copy-verification-link"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <Button 
                className="gap-2 bg-kaspa-cyan text-background hover:bg-kaspa-cyan/90"
                onClick={() => setLocation('/')}
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
