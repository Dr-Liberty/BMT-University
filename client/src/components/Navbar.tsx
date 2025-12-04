import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764823250369.jpg';
import { getAuthToken } from '@/lib/auth';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Navbar() {
  const [location] = useLocation();
  const authToken = getAuthToken();
  
  const { data: currentUser } = useQuery<{ id: string; walletAddress: string; role: string }>({
    queryKey: ['/api/auth/me'],
    enabled: !!authToken,
  });
  
  const isAdmin = currentUser?.role === 'admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border" data-testid="nav-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home-logo">
            <img 
              src={bmtLogo} 
              alt="BMT University" 
              className="w-10 h-10 rounded-full object-cover border-2 border-[#E8D5B0]"
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
            {isAdmin && (
              <Link
                href="/admin"
                className={`font-heading text-sm uppercase tracking-wide transition-colors flex items-center gap-1.5 ${
                  location === '/admin' || location.startsWith('/admin/')
                    ? 'text-kaspa-cyan'
                    : 'text-muted-foreground hover:text-white'
                }`}
                data-testid="link-nav-admin"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
}
