import React from 'react';
import HeroSection from '@/components/HeroSection';
import { UserFeedSection } from '@/components/UserFeedSection';
import { FeaturedArtists } from '@/components/FeaturedArtists';
import { TrendingArtists } from '@/components/TrendingArtists';
import { FeaturedTracks } from '@/components/FeaturedTracks';

const Index = () => {
  return (
    <main className="pt-16">
      <HeroSection />
      
      <FeaturedTracks />
      
      <FeaturedArtists />
      
      <TrendingArtists />
      
      <UserFeedSection />
      
      {/* Platform Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
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
