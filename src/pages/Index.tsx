import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HeroSection from '@/components/HeroSection';
import DiscoverySection from '@/components/DiscoverySection';
import { UserFeedSection } from '@/components/UserFeedSection';
import { WalletButton } from '@/components/WalletButton';
import { useWeb3 } from '@/hooks/useWeb3';
import { Play, Wallet, Crown, Star, DollarSign, Music, Users, Zap } from 'lucide-react';

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { isConnected } = useWeb3();
  return (
    <main className="pt-16">
        <HeroSection />
        
        <UserFeedSection />

        {/* Web3 Integration Section */}
        {!isConnected && (
          <Card className="glass-card border-aurora/30 bg-aurora/5 mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-aurora/20">
                  <Wallet className="h-12 w-12 text-aurora" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-aurora bg-clip-text text-transparent">
                Unlock Web3 Music Features
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your TON wallet to collect NFTs, join fan clubs, support artists directly, and access exclusive content.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Crown className="h-3 w-3" />
                  Fan Club Access
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Collect NFTs
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  Direct Payments
                </Badge>
              </div>
              <WalletButton />
            </CardContent>
          </Card>
        )}
      <DiscoverySection />
      
      {/* Phase 1 Development Status */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            Phase 1: Testnet Development
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">
            🚀 TON Payment System <span className="text-aurora">Now Live</span>
          </h2>
          <p className="text-muted-foreground mt-2">
            Real TON blockchain payments are now active! Connect your wallet to start tipping artists.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Index;
