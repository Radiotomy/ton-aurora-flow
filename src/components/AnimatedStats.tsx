import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Activity } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  color: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, suffix = '', color, delay = 0 }) => {
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
            className="text-lg font-bold text-foreground"
            key={displayValue}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {displayValue.toLocaleString()}{suffix}
          </motion.div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
      
      {/* Blockchain hash preview */}
      <div className="absolute bottom-1 right-2 text-xs text-muted-foreground/50 font-mono">
        #{Math.random().toString(16).substr(2, 6)}
      </div>
    </motion.div>
  );
};

const AnimatedStats: React.FC = () => {
  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <StatCard
        icon={<Activity className="w-5 h-5" />}
        value={52347}
        suffix="+"
        label="Tracks Minted"
        color="#6366f1"
        delay={0}
      />
      
      <StatCard
        icon={<Users className="w-5 h-5" />}
        value={12890}
        suffix="+"
        label="Active Artists"
        color="#8b5cf6"
        delay={200}
      />
      
      <StatCard
        icon={<Zap className="w-5 h-5" />}
        value={3254}
        suffix="K"
        label="NFTs Traded"
        color="#06b6d4"
        delay={400}
      />
      
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        value={156}
        suffix="K TON"
        label="Total Volume"
        color="#10b981"
        delay={600}
      />
    </motion.div>
  );
};

export default AnimatedStats;