import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { WalletButton } from '@/components/WalletButton';
import { SearchModal } from '@/components/SearchModal';
import { VoiceSearch } from '@/components/VoiceSearch';
import { AudiusLoginButton } from '@/components/AudiusLoginButton';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Music, 
  Users, 
  Palette, 
  Search,
  Mic,
  Menu,
  X,
  User,
  LogOut,
  Radio
} from 'lucide-react';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Discovery', href: '/' },
    { icon: Music, label: 'Playlists', href: '/playlists' },
    { icon: Radio, label: 'Live Events', href: '/live-events' },
    { icon: Users, label: 'Fan Clubs', href: '/fan-clubs' },
    { icon: Palette, label: 'Creator Studio', href: '/creator-studio' },
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
            <span className="text-xl font-bold text-aurora">AudioTon</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center space-x-2 aurora-hover px-3 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === item.href 
                    ? 'text-aurora' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Dialog open={isVoiceSearchOpen} onOpenChange={setIsVoiceSearchOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <VoiceSearch 
                  onResults={(query) => {
                    setIsVoiceSearchOpen(false);
                    setIsSearchOpen(true);
                  }}
                  onClose={() => setIsVoiceSearchOpen(false)}
                />
              </DialogContent>
            </Dialog>
            
            {/* Audius Login */}
            <AudiusLoginButton />
            
            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <User className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
      <WalletButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
                <WalletButton />
              </div>
            )}
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
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center space-x-2 aurora-hover px-3 py-2 rounded-lg block ${
                    location.pathname === item.href 
                      ? 'text-aurora' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
              
              <div className="flex items-center space-x-2 px-3 py-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground flex-1"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                
                <Dialog open={isVoiceSearchOpen} onOpenChange={setIsVoiceSearchOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <VoiceSearch 
                      onResults={(query) => {
                        setIsVoiceSearchOpen(false);
                        setIsSearchOpen(true);
                      }}
                      onClose={() => setIsVoiceSearchOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="pt-2 border-t border-glass-border">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/dashboard');
                      }}
                      className="w-full justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="w-full justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                    <WalletButton />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/auth');
                      }}
                      className="w-full justify-start"
                    >
                      Sign In
                    </Button>
                    <WalletButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

export default Navigation;