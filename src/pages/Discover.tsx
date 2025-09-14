import React from 'react';
import { Badge } from '@/components/ui/badge';
import DiscoverySection from '@/components/DiscoverySection';
import { AIRecommendations } from '@/components/AIRecommendations';

const Discover = () => {
  return (
    <main className="pt-16">
      {/* Page Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            Powered by AI & Audius
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Discover Your Next Favorite <span className="text-aurora">Track</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore personalized recommendations, trending music, and discover new artists 
            from the Audius ecosystem and AudioTon community.
          </p>
        </div>
      </section>

      {/* AI Recommendations Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <AIRecommendations className="mb-8" maxItems={8} />
      </section>

      {/* Discovery Section */}
      <DiscoverySection />
      
      {/* Additional Discovery Features */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Advanced Discovery Tools
          </h2>
          <p className="text-muted-foreground mb-6">
            Use our advanced filters and AI-powered recommendations to find exactly what you're looking for.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass-panel p-6 rounded-lg border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">Smart Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                AI analyzes your listening history to suggest perfect matches
              </p>
            </div>
            <div className="glass-panel p-6 rounded-lg border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">Genre Exploration</h3>
              <p className="text-sm text-muted-foreground">
                Dive deep into specific genres and discover emerging sub-genres
              </p>
            </div>
            <div className="glass-panel p-6 rounded-lg border-glass-border">
              <h3 className="font-semibold text-foreground mb-2">Trending Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Stay ahead with real-time trending data and popularity metrics
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Discover;