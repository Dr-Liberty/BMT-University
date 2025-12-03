import { Link, useLocation } from 'wouter';
import WalletConnectButton from './WalletConnectButton';
import bmtLogo from '@assets/Gemini_Generated_Image_a36drsa36drsa36d_1764781999555.png';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border" data-testid="nav-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home-logo">
            <img 
              src={bmtLogo} 
              alt="BMT University" 
              className="w-10 h-10 rounded-full object-cover border-2 border-kaspa-cyan"
            />
            <span className="font-heading font-bold text-xl text-white hidden sm:block">
              BMT <span className="text-kaspa-cyan">University</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-heading text-sm uppercase tracking-wide transition-colors ${
                  location === link.href
                    ? 'text-kaspa-cyan'
                    : 'text-muted-foreground hover:text-white'
                }`}
                data-testid={`link-nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
}
