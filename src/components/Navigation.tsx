import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/WalletButton';
import { 
  Home, 
  Music, 
  Users, 
  Palette, 
  Search,
  Menu,
  X 
} from 'lucide-react';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Discovery', href: '#' },
    { icon: Music, label: 'Tracks', href: '#' },
    { icon: Users, label: 'Fan Clubs', href: '#' },
    { icon: Palette, label: 'Creator Studio', href: '#' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-0 border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-aurora rounded-lg animate-glow-pulse flex items-center justify-center">
              <Music className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold text-aurora">Audius TON</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground aurora-hover px-3 py-2 rounded-lg transition-all duration-300"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
            </Button>
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-glass-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground aurora-hover px-3 py-2 rounded-lg block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              ))}
              <div className="pt-2 border-t border-glass-border">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;