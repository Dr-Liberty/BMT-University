import { Link } from 'wouter';
import bmtLogo from '@assets/BMT_Meme_1_1764741215718.jpg';
import { SiX, SiTelegram, SiDiscord } from 'react-icons/si';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 px-4 sm:px-6" data-testid="footer-main">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img
                src={bmtLogo}
                alt="BMT University"
                className="w-12 h-12 rounded-full border-2 border-kaspa-cyan"
              />
              <span className="font-heading font-bold text-xl text-white">
                BMT <span className="text-kaspa-cyan">University</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-sm">
              The premier blockchain learning platform on Kaspa. Learn, earn $BMT tokens, 
              and collect Bitcoin Maxi Tears.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-kaspa-cyan transition-colors"
                data-testid="link-twitter"
              >
                <SiX className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-kaspa-cyan transition-colors"
                data-testid="link-telegram"
              >
                <SiTelegram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-kaspa-cyan transition-colors"
                data-testid="link-discord"
              >
                <SiDiscord className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-kaspa-cyan transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-kaspa-cyan transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-muted-foreground hover:text-kaspa-cyan transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-kaspa-cyan transition-colors">
                  Kasplex
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-kaspa-cyan transition-colors">
                  Kaspa.org
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-kaspa-cyan transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2025 BMT University. All rights reserved.</p>
          <p>
            Powered by <span className="text-kaspa-cyan">Kaspa</span> & <span className="text-kaspa-green">Kasplex</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
