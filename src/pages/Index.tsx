import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import HeroSection from '@/components/HeroSection';
import DiscoverySection from '@/components/DiscoverySection';
import { UserFeedSection } from '@/components/UserFeedSection';
import { AIRecommendations } from '@/components/AIRecommendations';

const Index = () => {
  return (
    <main className="pt-16">
        <HeroSection />
        
        <UserFeedSection />

        {/* AI Recommendations Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <AIRecommendations className="mb-8" maxItems={6} />
        </section>

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
