import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Activity, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  color: string;
  delay?: number;
  isLive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, suffix = '', color, delay = 0, isLive = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayValue(prev => {
          const increment = Math.ceil(value / 50);
          return prev + increment >= value ? value : prev + increment;
        });
      }, 50);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 10, 
        boxShadow: `0 10px 30px ${color}20` 
      }}
      className="glass-panel p-4 rounded-xl border border-glass-border/20 relative overflow-hidden group cursor-pointer"
    >
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${color}40, transparent)` }}
      />
      
      <div className="relative z-10 flex items-center space-x-3">
        <motion.div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ color }}>{icon}</div>
        </motion.div>
        
        <div>
          <motion.div 
            className="text-lg font-bold text-foreground flex items-center gap-1"
            key={displayValue}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {displayValue.toLocaleString()}{suffix}
            {isLive && (
              <span className="ml-1 text-xs text-green-500 font-normal flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />
                live
              </span>
            )}
          </motion.div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </motion.div>
  );
};

const AnimatedStats: React.FC = () => {
  const [stats, setStats] = useState({
    tracksMinted: 0,
    activeArtists: 0,
    nftsTraded: 0,
    totalVolume: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      // Fetch real data from Supabase
      const [tracksResult, artistsResult, nftResult, volumeResult] = await Promise.all([
        supabase.from('track_collections').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true })
          .in('role', ['audius_artist', 'verified_audius_artist', 'platform_artist', 'verified_platform_artist']),
        supabase.from('nft_marketplace').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('transactions').select('amount_ton').eq('status', 'completed')
      ]);

      const totalVolume = volumeResult.data?.reduce((sum, tx) => sum + (tx.amount_ton || 0), 0) || 0;

      setStats({
        tracksMinted: tracksResult.count || 0,
        activeArtists: artistsResult.count || 0,
        nftsTraded: nftResult.count || 0,
        totalVolume: Math.round(totalVolume)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="space-y-4 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      {/* Just Launched Badge */}
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="glass-panel px-4 py-2 rounded-full border border-aurora/30 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-aurora" />
          <span className="text-sm font-medium text-aurora">Just Launched — Be Among the First!</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          value={stats.tracksMinted}
          suffix=""
          label="Tracks Collected"
          color="#6366f1"
          delay={0}
          isLive={!loading}
        />
        
        <StatCard
          icon={<Users className="w-5 h-5" />}
          value={stats.activeArtists}
          suffix=""
          label="Verified Artists"
          color="#8b5cf6"
          delay={200}
          isLive={!loading}
        />
        
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          value={stats.nftsTraded}
          suffix=""
          label="NFTs Traded"
          color="#06b6d4"
          delay={400}
          isLive={!loading}
        />
        
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={stats.totalVolume}
          suffix=" TON"
          label="Total Volume"
          color="#10b981"
          delay={600}
          isLive={!loading}
        />
      </div>

      {/* Growth message for new platform */}
      <motion.p 
        className="text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Join our growing community of artists and collectors on TON
      </motion.p>
    </motion.div>
  );
};

export default AnimatedStats;
