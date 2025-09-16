import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp } from 'lucide-react';
import { useAudioToken } from '@/hooks/useAudioToken';

export const AudioTokenWidget: React.FC = () => {
  const { balance, loading } = useAudioToken();

  return (
    <Card className="gradient-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            $AUDIO Balance
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Web3 Music Token
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold gradient-text">
              {balance.balance.toLocaleString()} $AUDIO
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-lg font-semibold text-success">
              +{balance.total_earnings.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending Rewards</span>
            <span className="text-sm font-bold text-success">
              +{balance.pending_rewards.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};