import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletButton } from '@/components/WalletButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Zap, Wifi, TrendingUp } from 'lucide-react';
import { useTonConnectUI } from '@tonconnect/ui-react';

const NetworkStatusIndicator: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [blockHeight, setBlockHeight] = useState(15847239);
  const [gasPrice, setGasPrice] = useState(0.005);

  useEffect(() => {
    if (tonConnectUI?.wallet) {
      setNetworkStatus('connected');
    } else {
      setNetworkStatus('disconnected');
    }
  }, [tonConnectUI?.wallet]);

  useEffect(() => {
    // Simulate live blockchain updates
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + Math.floor(Math.random() * 3) + 1);
      setGasPrice(prev => prev + (Math.random() - 0.5) * 0.001);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (networkStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
    }
  };

  return (
    <motion.div 
      className="glass-panel px-4 py-2 rounded-full border border-glass-border/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getStatusColor() }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Wifi className="w-4 h-4" style={{ color: getStatusColor() }} />
          <span className="text-muted-foreground">TON Network</span>
        </div>
        
        <div className="h-4 w-px bg-glass-border/40" />
        
        <div className="flex items-center space-x-1 text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span className="font-mono text-xs">#{blockHeight.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center space-x-1 text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span className="font-mono text-xs">{gasPrice.toFixed(3)} TON</span>
        </div>
      </div>
    </motion.div>
  );
};

const EnhancedCTAButtons: React.FC = () => {
  const [currentGenre, setCurrentGenre] = useState('Electronic');
  const [isLiveEvent, setIsLiveEvent] = useState(false);

  useEffect(() => {
    const genres = ['Electronic', 'Hip-Hop', 'House', 'Techno', 'Ambient', 'Trap'];
    const genreInterval = setInterval(() => {
      setCurrentGenre(genres[Math.floor(Math.random() * genres.length)]);
    }, 3000);

    const eventInterval = setInterval(() => {
      setIsLiveEvent(Math.random() > 0.7);
    }, 8000);

    return () => {
      clearInterval(genreInterval);
      clearInterval(eventInterval);
    };
  }, []);

  return (
    <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <motion.div
        key={currentGenre + isLiveEvent}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button 
          size="lg" 
          variant="aurora"
          className="px-8 py-4 text-lg font-medium relative overflow-hidden group"
          onClick={() => {
            const element = document.getElementById('discovery') || document.querySelector('[data-section="discovery"]');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20"
            animate={{ 
              background: [
                'linear-gradient(45deg, hsl(var(--primary))/20, hsl(var(--secondary))/20)',
                'linear-gradient(45deg, hsl(var(--secondary))/20, hsl(var(--accent))/20)',
                'linear-gradient(45deg, hsl(var(--accent))/20, hsl(var(--primary))/20)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative z-10 flex items-center">
            <Play className="w-5 h-5 mr-2" />
            {isLiveEvent ? 'Join Live Event' : `Explore ${currentGenre}`}
          </div>
          
          {isLiveEvent && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </Button>
      </motion.div>
      
      <WalletButton />
      
      {isLiveEvent && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Badge variant="secondary" className="glass-panel bg-red-500/20 text-red-200 animate-pulse">
            🔴 Live Now
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
};

const EnhancedWalletSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <NetworkStatusIndicator />
      <EnhancedCTAButtons />
    </div>
  );
};

export default EnhancedWalletSection;