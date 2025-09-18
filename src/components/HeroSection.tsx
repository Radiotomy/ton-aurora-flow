import { Badge } from '@/components/ui/badge';
import { Headphones, Zap, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import BlockchainBackground from '@/components/BlockchainBackground';
import AnimatedStats from '@/components/AnimatedStats';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import EnhancedWalletSection from '@/components/EnhancedWalletSection';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Blockchain Background */}
      <BlockchainBackground />
      
      {/* Live Activity Feed */}
      <LiveActivityFeed />
      
      {/* Enhanced Floating Elements */}
      <motion.div 
        className="absolute top-20 left-4 sm:left-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <motion.div 
          className="glass-panel p-3 rounded-xl border border-glass-border/20"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <TrendingUp className="w-6 h-6 text-primary" />
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="absolute top-32 right-4 sm:right-16 lg:right-80"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <motion.div
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3, repeat: Infinity }}
          whileHover={{ scale: 1.05 }}
        >
          <Badge variant="secondary" className="glass-panel bg-gradient-to-r from-secondary/20 to-accent/20 text-foreground border border-glass-border/20">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Blockchain Active
          </Badge>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-32 left-4 sm:left-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <motion.div 
          className="glass-panel p-2 rounded-lg border border-glass-border/20"
          animate={{ y: [5, -15, 5] }}
          transition={{ duration: 5, repeat: Infinity }}
          whileHover={{ scale: 1.1, rotate: -5 }}
        >
          <Headphones className="w-5 h-5 text-accent" />
        </motion.div>
      </motion.div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="space-y-10">
          {/* Main Heading */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
            >
              <motion.span 
                className="text-aurora animate-aurora-flow bg-clip-text"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                The Future of Music
              </motion.span>
              <br />
              <motion.span 
                className="text-foreground"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                is On-Chain
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Stream, create, and own music on the blockchain. Where every beat lives forever on 
              <motion.span 
                className="text-primary font-semibold"
                animate={{ color: ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--primary))'] }}
                transition={{ duration: 3, repeat: Infinity }}
              > TON network.</motion.span>
            </motion.p>
            
            <motion.div
              className="flex items-center justify-center space-x-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>⚡ TON Network Active • 2.1s avg confirmation</span>
            </motion.div>
          </motion.div>
          
          {/* Interactive Stats Dashboard */}
          <AnimatedStats />
          
          {/* Enhanced Call to Action */}
          <EnhancedWalletSection />
          
          {/* Enhanced Features Showcase */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            {[
              { label: '⚡ Lightning-fast Payments', color: '#10b981' },
              { label: '🛡️ Immutable Ownership', color: '#6366f1' },
              { label: '🌐 Cross-chain Bridge', color: '#8b5cf6' },
              { label: '🎵 Creator Royalties', color: '#06b6d4' },
              { label: '🎪 Token-Gated Events', color: '#f59e0b' },
              { label: '💎 NFT Collections', color: '#ec4899' }
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <Badge 
                  variant="outline" 
                  className="glass-panel bg-background/5 text-foreground border-glass-border/30 px-3 py-2 cursor-pointer transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    borderColor: `${feature.color}40`,
                    boxShadow: `0 0 20px ${feature.color}10`
                  }}
                >
                  {feature.label}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;