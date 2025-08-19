import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Headphones, Zap, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-aurora.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Aurora Web3 Music Experience"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float delay-1000">
        <div className="glass-panel p-3 rounded-xl">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      <div className="absolute top-32 right-16 animate-float delay-2000">
        <Badge variant="secondary" className="glass-panel bg-secondary/20 text-secondary-foreground">
          <Zap className="w-3 h-3 mr-1" />
          Live Events
        </Badge>
      </div>
      
      <div className="absolute bottom-32 left-20 animate-float delay-500">
        <div className="glass-panel p-2 rounded-lg">
          <Headphones className="w-5 h-5 text-accent" />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-aurora animate-aurora-flow">Web3 Music</span>
              <br />
              <span className="text-foreground">Reimagined</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stream, mint, and connect in the first TON-integrated Audius client. 
              <span className="text-primary font-medium"> Own your music journey.</span>
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="glass-panel px-4 py-2 rounded-full">
              <span className="text-primary font-bold">50K+</span>
              <span className="text-muted-foreground ml-1">Tracks</span>
            </div>
            <div className="glass-panel px-4 py-2 rounded-full">
              <span className="text-secondary font-bold">12K+</span>
              <span className="text-muted-foreground ml-1">Artists</span>
            </div>
            <div className="glass-panel px-4 py-2 rounded-full">
              <span className="text-accent font-bold">3M+</span>
              <span className="text-muted-foreground ml-1">NFTs Minted</span>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="glass-button bg-primary/20 hover:bg-primary/30 text-primary-foreground px-8 py-4 text-lg font-medium">
              <Play className="w-5 h-5 mr-2" />
              Start Listening
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="glass-button border-glass-border px-8 py-4 text-lg font-medium"
            >
              <Zap className="w-5 h-5 mr-2" />
              Connect TON Wallet
            </Button>
          </div>
          
          {/* Features Highlight */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {[
              'Token-Gated Events',
              'NFT Music Collection',
              'Creator Royalties',
              'Fan Club Access'
            ].map((feature) => (
              <Badge 
                key={feature}
                variant="outline" 
                className="glass-panel bg-background/10 text-foreground border-glass-border px-3 py-1"
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;