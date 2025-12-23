import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Shield, Menu } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WalletConnectButton from './WalletConnectButton';
import LanguageSwitcher from './LanguageSwitcher';
import bmtLogo from '@assets/photo_2025-12-03_15-48-49_1764823250369.jpg';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const authToken = getAuthToken();
  
  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/courses', label: t('nav.courses') },
    { href: '/about', label: t('nav.about') },
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/analytics', label: t('nav.analytics') },
  ];
  
  const { data: currentUser } = useQuery<{ id: string; walletAddress: string; role: string }>({
    queryKey: ['/api/auth/me'],
    enabled: !!authToken,
  });
  
  const isAdmin = currentUser?.role === 'admin';

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) => {
    const isActive = href === '/' ? location === href : location === href || location.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={`font-heading text-sm uppercase tracking-wide transition-colors flex items-center gap-1.5 ${
          isActive
            ? 'text-kaspa-cyan'
            : 'text-muted-foreground hover:text-white'
        }`}
        data-testid={`link-nav-${label.toLowerCase()}`}
      >
        {icon}
        {label}
      </Link>
    );
  };

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
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
            {isAdmin && (
              <NavLink href="/admin" label="Admin" icon={<Shield className="w-4 h-4" />} />
            )}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <WalletConnectButton />
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  data-testid="button-nav-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3">
                    <img 
                      src={bmtLogo} 
                      alt="BMT University" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#E8D5B0]"
                    />
                    <span className="font-heading font-bold text-lg text-white">
                      BMT <span className="text-kaspa-cyan">University</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`font-heading text-base uppercase tracking-wide transition-colors py-2 px-3 rounded-md hover-elevate ${
                        location === link.href
                          ? 'text-kaspa-cyan bg-kaspa-cyan/10'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                      data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`font-heading text-base uppercase tracking-wide transition-colors py-2 px-3 rounded-md hover-elevate flex items-center gap-2 ${
                        location === '/admin' || location.startsWith('/admin/')
                          ? 'text-kaspa-cyan bg-kaspa-cyan/10'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                      data-testid="link-mobile-nav-admin"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
