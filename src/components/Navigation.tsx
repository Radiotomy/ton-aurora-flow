import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { WalletButton } from '@/components/WalletButton';
import { SearchModal } from '@/components/SearchModal';
import { VoiceSearch } from '@/components/VoiceSearch';
import { AudiusLoginButton } from '@/components/AudiusLoginButton';
import { CrossChainBridgeModal } from '@/components/CrossChainBridgeModal';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
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
  Radio,
  ShoppingCart,
  ArrowRightLeft,
  Rocket
} from 'lucide-react';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const { canAccessCreatorStudio } = useUserRoles(user?.id);

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Discover', href: '/discover' },
    { icon: ShoppingCart, label: 'Marketplace', href: '/marketplace' },
    { icon: Music, label: 'Playlists', href: '/playlists' },
    { icon: Radio, label: 'Live Events', href: '/live-events' },
    { icon: Users, label: 'Fan Clubs', href: '/fan-clubs' },
    // { icon: Rocket, label: 'Deploy', href: '/mainnet-deploy' }, // Hidden after successful mainnet deployment
  ];

  // Only show Creator Studio for artists
  const artistNavItems = [
    { icon: Palette, label: 'Creator Studio', href: '/creator-studio' },
  ];

  // Developer/admin items
  const devNavItems = [
    { icon: Rocket, label: 'Deploy', href: '/mainnet-deploy' },
  ];

  const allNavItems = [...navItems, ...(canAccessCreatorStudio() ? artistNavItems : [])];

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-0 border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-aurora rounded-lg animate-glow-pulse flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-aurora truncate">AudioTon</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {allNavItems.map((item) => (
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
            <div className="hidden lg:flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
              
              <Dialog open={isVoiceSearchOpen} onOpenChange={setIsVoiceSearchOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
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
              
              {/* Cross-Chain Bridge */}
              {isAuthenticated && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
                  onClick={() => setIsBridgeOpen(true)}
                  title="Token Bridge"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              )}
              
              {/* Audius Login */}
              <AudiusLoginButton />
              
              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-muted-foreground hover:text-foreground h-9 w-9 p-0"
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

            {/* Mobile Header Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 p-0"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Slide-Down Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-glass-border animate-in slide-in-from-top duration-200">
              <div className="py-3 space-y-1">
                {/* Search & Voice in Mobile Menu */}
                <div className="flex items-center gap-2 px-2 pb-3 border-b border-glass-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-11 justify-start"
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
                        variant="outline" 
                        size="sm" 
                        className="h-11 w-11 p-0"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md mx-4">
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
                
                {/* Auth Section */}
                <div className="px-2 pb-3 border-b border-glass-border">
                  {isAuthenticated ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/dashboard');
                        }}
                        className="flex-1 h-11 justify-start"
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
                        className="h-11 w-11 p-0"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="aurora"
                      size="sm"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/auth');
                      }}
                      className="w-full h-11"
                    >
                      Sign In / Sign Up
                    </Button>
                  )}
                  <div className="mt-2">
                    <WalletButton />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-0 border-t border-glass-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
                location.pathname === item.href 
                  ? 'text-aurora bg-aurora/10' 
                  : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={`w-5 h-5 mb-1 ${location.pathname === item.href ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          ))}
          {canAccessCreatorStudio() && (
            <Link
              to="/creator-studio"
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
                location.pathname === '/creator-studio' 
                  ? 'text-aurora bg-aurora/10' 
                  : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
              }`}
            >
              <Palette className={`w-5 h-5 mb-1 ${location.pathname === '/creator-studio' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium leading-tight">Studio</span>
            </Link>
          )}
        </div>
      </nav>
      
      <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      {isAuthenticated && (
        <CrossChainBridgeModal 
          open={isBridgeOpen} 
          onOpenChange={setIsBridgeOpen}
          balances={[]}
          onConversionComplete={() => {}}
        />
      )}
    </>
  );
};

export default Navigation;