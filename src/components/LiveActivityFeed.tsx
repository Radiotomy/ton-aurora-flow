import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Zap, Trophy, Users } from 'lucide-react';

interface Activity {
  id: string;
  type: 'mint' | 'sale' | 'tip' | 'event';
  message: string;
  value?: string;
  user: string;
  timestamp: Date;
  hash: string;
}

const ActivityBubble: React.FC<{ activity: Activity; onComplete: () => void }> = ({ 
  activity, 
  onComplete 
}) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'mint': return <Music className="w-4 h-4" />;
      case 'sale': return <Zap className="w-4 h-4" />;
      case 'tip': return <Trophy className="w-4 h-4" />;
      case 'event': return <Users className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (activity.type) {
      case 'mint': return '#8b5cf6';
      case 'sale': return '#06b6d4';
      case 'tip': return '#10b981';
      case 'event': return '#f59e0b';
    }
  };

  useEffect(() => {
    const timer = setTimeout(onComplete, 8000); // Remove after 8 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -300, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.05, x: -10 }}
      className="glass-panel p-3 rounded-lg border border-glass-border/20 mb-2 cursor-pointer max-w-xs"
      style={{ borderColor: `${getColor()}40` }}
    >
      <div className="flex items-start space-x-2">
        <motion.div 
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${getColor()}20` }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div style={{ color: getColor() }}>{getIcon()}</div>
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium truncate">
            {activity.message}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-primary font-semibold">
              @{activity.user}
            </span>
            {activity.value && (
              <span className="text-xs font-mono text-accent">
                {activity.value}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground/70 font-mono mt-1">
            #{activity.hash}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  const generateActivity = (): Activity => {
    const types: Activity['type'][] = ['mint', 'sale', 'tip', 'event'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const users = ['musiclover', 'beatmaker', 'nftfan', 'cryptoartist', 'tonhodler'];
    const user = users[Math.floor(Math.random() * users.length)];
    
    const messages = {
      mint: ['Minted new track NFT', 'Created exclusive beat', 'Dropped album NFT'],
      sale: ['Purchased rare NFT', 'Bought track collection', 'Acquired music NFT'],
      tip: ['Tipped favorite artist', 'Supported new musician', 'Rewarded creator'],
      event: ['Joined live concert', 'Entered exclusive event', 'RSVP\'d to show']
    };
    
    const values = {
      mint: ['2.5 TON', '5.1 TON', '1.8 TON'],
      sale: ['12.3 TON', '8.7 TON', '15.2 TON'],
      tip: ['0.5 TON', '1.2 TON', '0.8 TON'],
      event: ['Free', '3.0 TON', '2.5 TON']
    };
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message: messages[type][Math.floor(Math.random() * messages[type].length)],
      value: type !== 'event' || Math.random() > 0.3 ? values[type][Math.floor(Math.random() * values[type].length)] : undefined,
      user,
      timestamp: new Date(),
      hash: Math.random().toString(16).substr(2, 8).toUpperCase()
    };
  };

  useEffect(() => {
    // Generate initial activities
    const initialActivities = Array.from({ length: 3 }, generateActivity);
    setActivities(initialActivities);

    // Generate new activities periodically
    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivity = generateActivity();
        return [newActivity, ...prev].slice(0, 5); // Keep only 5 activities
      });
    }, 4000 + Math.random() * 3000); // Random interval between 4-7 seconds

    return () => clearInterval(interval);
  }, []);

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  return (
    <div className="absolute top-20 right-4 sm:right-8 z-20 max-w-xs">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <div className="glass-panel px-3 py-2 rounded-lg border border-glass-border/20 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">Live Activity</span>
          </div>
        </div>
        
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <ActivityBubble
              key={activity.id}
              activity={activity}
              onComplete={() => removeActivity(activity.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LiveActivityFeed;