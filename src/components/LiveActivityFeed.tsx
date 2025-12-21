import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Zap, Trophy, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  type: 'mint' | 'sale' | 'tip' | 'event' | 'welcome';
  message: string;
  value?: string;
  user: string;
  timestamp: Date;
  hash: string;
  isReal?: boolean;
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
      case 'welcome': return <Sparkles className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (activity.type) {
      case 'mint': return '#8b5cf6';
      case 'sale': return '#06b6d4';
      case 'tip': return '#10b981';
      case 'event': return '#f59e0b';
      case 'welcome': return '#ec4899';
    }
  };

  useEffect(() => {
    const timer = setTimeout(onComplete, 10000);
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
              {activity.user}
            </span>
            {activity.value && (
              <span className="text-xs font-mono text-accent">
                {activity.value}
              </span>
            )}
          </div>
          {activity.isReal && (
            <div className="text-xs text-muted-foreground/70 font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              #{activity.hash}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasRealActivity, setHasRealActivity] = useState(false);

  // Welcome messages for newly launched platform
  const launchMessages: Activity[] = [
    {
      id: 'launch-1',
      type: 'welcome',
      message: 'AudioTon is now live!',
      user: '🎉 Launch Day',
      timestamp: new Date(),
      hash: 'LAUNCH',
      isReal: true
    },
    {
      id: 'launch-2',
      type: 'welcome',
      message: 'Be the first to mint an NFT',
      user: '💎 Early Access',
      timestamp: new Date(),
      hash: 'EARLY',
      isReal: true
    },
    {
      id: 'launch-3',
      type: 'welcome',
      message: 'Artists: Upload your first track!',
      user: '🎵 Creator Studio',
      timestamp: new Date(),
      hash: 'CREATE',
      isReal: true
    }
  ];

  useEffect(() => {
    // Start with launch messages
    setActivities(launchMessages.slice(0, 2));

    // Subscribe to real transactions
    const channel = supabase
      .channel('live-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          const tx = payload.new;
          const newActivity: Activity = {
            id: tx.id,
            type: tx.transaction_type === 'tip' ? 'tip' : 'sale',
            message: tx.transaction_type === 'tip' ? 'Sent a tip to artist' : 'New transaction',
            value: `${tx.amount_ton} TON`,
            user: 'User',
            timestamp: new Date(tx.created_at),
            hash: tx.transaction_hash?.slice(-8) || 'pending',
            isReal: true
          };
          
          setHasRealActivity(true);
          setActivities(prev => [newActivity, ...prev].slice(0, 5));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_collections'
        },
        (payload) => {
          const collection = payload.new;
          const newActivity: Activity = {
            id: collection.id,
            type: 'mint',
            message: 'Collected a new track!',
            value: collection.purchase_price ? `${collection.purchase_price} TON` : undefined,
            user: 'Collector',
            timestamp: new Date(collection.collected_at),
            hash: collection.id.slice(-8),
            isReal: true
          };
          
          setHasRealActivity(true);
          setActivities(prev => [newActivity, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    // Rotate launch messages slowly
    const interval = setInterval(() => {
      if (!hasRealActivity) {
        setActivities(prev => {
          const nextMessage = launchMessages.find(m => !prev.some(p => p.id === m.id));
          if (nextMessage) {
            return [nextMessage, ...prev].slice(0, 3);
          }
          // Cycle through messages
          const randomMsg = launchMessages[Math.floor(Math.random() * launchMessages.length)];
          return [{ ...randomMsg, id: `${randomMsg.id}-${Date.now()}` }, ...prev].slice(0, 3);
        });
      }
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [hasRealActivity]);

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
            <div className={`w-2 h-2 rounded-full animate-pulse ${hasRealActivity ? 'bg-green-500' : 'bg-aurora'}`} />
            <span className="text-xs text-muted-foreground font-medium">
              {hasRealActivity ? 'Live Activity' : 'Platform Ready'}
            </span>
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
