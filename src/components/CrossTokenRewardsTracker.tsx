import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Award, 
  Star, 
  Crown, 
  Zap, 
  TrendingUp,
  Gift,
  Target,
  Sparkles
} from 'lucide-react';
import { EnhancedPaymentService, CrossTokenReward } from '@/services/enhancedPaymentService';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RewardStats {
  totalTonEarned: number;
  totalAudioEarned: number;
  currentMultiplier: number;
  loyaltyTier: string;
  streakDays: number;
  nextRewardAt: number;
  weeklyProgress: {
    current: number;
    target: number;
    bonus: number;
  };
}

interface ActivityReward {
  activity: string;
  tonReward: number;
  audioReward: number;
  multiplier: number;
  timestamp: Date;
  bonusType: CrossTokenReward['bonusType'];
}

export const CrossTokenRewardsTracker = () => {
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null);
  const [recentRewards, setRecentRewards] = useState<ActivityReward[]>([]);
  const [loading, setLoading] = useState(true);

  const { profile } = useWeb3();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchRewardStats();
      fetchRecentRewards();
    }
  }, [profile?.id]);

  const fetchRewardStats = async () => {
    if (!profile?.id) return;

    try {
      // Fetch user's reward statistics
      const { data: stats } = await supabase
        .from('user_reward_stats')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (stats) {
        setRewardStats({
          totalTonEarned: stats.total_ton_rewards || 0,
          totalAudioEarned: stats.total_audio_rewards || 0,
          currentMultiplier: stats.current_multiplier || 1.0,
          loyaltyTier: stats.loyalty_tier || 'bronze',
          streakDays: stats.streak_days || 0,
          nextRewardAt: stats.next_reward_threshold || 100,
          weeklyProgress: {
            current: stats.weekly_activity || 0,
            target: stats.weekly_target || 50,
            bonus: stats.weekly_bonus || 10
          }
        });
      } else {
        // Create default stats
        setRewardStats({
          totalTonEarned: 0,
          totalAudioEarned: 0,
          currentMultiplier: 1.0,
          loyaltyTier: 'bronze',
          streakDays: 0,
          nextRewardAt: 100,
          weeklyProgress: {
            current: 0,
            target: 50,
            bonus: 10
          }
        });
      }
    } catch (error) {
      console.error('Error fetching reward stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRewards = async () => {
    if (!profile?.id) return;

    try {
      const { data: rewards } = await supabase
        .from('reward_history')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (rewards) {
        setRecentRewards(rewards.map(r => ({
          activity: r.activity_type,
          tonReward: r.ton_amount || 0,
          audioReward: r.audio_amount || 0,
          multiplier: r.multiplier || 1.0,
          timestamp: new Date(r.created_at),
          bonusType: r.bonus_type || 'activity'
        })));
      }
    } catch (error) {
      console.error('Error fetching recent rewards:', error);
    }
  };

  const claimWeeklyBonus = async () => {
    if (!profile?.id || !rewardStats) return;

    try {
      // Calculate weekly bonus rewards
      const bonusRewards = await EnhancedPaymentService.calculateCrossTokenRewards(
        profile.id,
        'purchase',
        rewardStats.weeklyProgress.bonus
      );

      // Award the bonus
      await supabase.from('reward_history').insert({
        profile_id: profile.id,
        activity_type: 'weekly_bonus',
        ton_amount: bonusRewards.tonAmount,
        audio_amount: bonusRewards.audioAmount,
        multiplier: bonusRewards.multiplier,
        bonus_type: 'loyalty'
      });

      // Update token balances
      if (bonusRewards.tonAmount > 0) {
        await supabase.rpc('update_token_balance', {
          p_profile_id: profile.id,
          p_token_type: 'TON',
          p_amount: bonusRewards.tonAmount
        });
      }

      if (bonusRewards.audioAmount > 0) {
        await supabase.rpc('update_token_balance', {
          p_profile_id: profile.id,
          p_token_type: 'AUDIO',
          p_amount: bonusRewards.audioAmount
        });
      }

      toast({
        title: "Weekly Bonus Claimed! 🎉",
        description: `Earned ${bonusRewards.tonAmount.toFixed(4)} TON + ${bonusRewards.audioAmount.toFixed(4)} $AUDIO`
      });

      // Refresh stats
      fetchRewardStats();
      fetchRecentRewards();

    } catch (error) {
      console.error('Error claiming weekly bonus:', error);
      toast({
        title: "Claim Failed",
        description: "Failed to claim weekly bonus",
        variant: "destructive"
      });
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="h-4 w-4 text-purple-500" />;
      case 'gold': return <Award className="h-4 w-4 text-yellow-500" />;
      case 'silver': return <Star className="h-4 w-4 text-gray-400" />;
      default: return <Award className="h-4 w-4 text-orange-500" />;
    }
  };

  const getBonusTypeIcon = (bonusType: CrossTokenReward['bonusType']) => {
    switch (bonusType) {
      case 'staking': return <Zap className="h-3 w-3 text-blue-500" />;
      case 'loyalty': return <Crown className="h-3 w-3 text-purple-500" />;
      case 'volume': return <TrendingUp className="h-3 w-3 text-green-500" />;
      default: return <Sparkles className="h-3 w-3 text-orange-500" />;
    }
  };

  const formatReward = (amount: number) => {
    return amount > 0.01 ? amount.toFixed(4) : amount.toFixed(6);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rewardStats) return null;

  const weeklyProgress = (rewardStats.weeklyProgress.current / rewardStats.weeklyProgress.target) * 100;
  const canClaimWeekly = weeklyProgress >= 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Cross-Token Rewards
          <Badge variant="outline" className="ml-auto">
            {getTierIcon(rewardStats.loyaltyTier)}
            {rewardStats.loyaltyTier.charAt(0).toUpperCase() + rewardStats.loyaltyTier.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Rewards Earned */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total TON Earned</div>
            <div className="text-lg font-bold text-primary">
              💎 {formatReward(rewardStats.totalTonEarned)}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total $AUDIO Earned</div>
            <div className="text-lg font-bold text-primary">
              ♫ {formatReward(rewardStats.totalAudioEarned)}
            </div>
          </div>
        </div>

        {/* Current Multiplier & Streak */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Current Multiplier</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {rewardStats.currentMultiplier.toFixed(1)}x
            </Badge>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {rewardStats.streakDays} day streak
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Weekly Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Weekly Challenge</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {rewardStats.weeklyProgress.current}/{rewardStats.weeklyProgress.target} activities
            </span>
          </div>
          
          <Progress value={weeklyProgress} className="h-2" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Bonus: {rewardStats.weeklyProgress.bonus} tokens
            </span>
            <Button
              size="sm"
              onClick={claimWeeklyBonus}
              disabled={!canClaimWeekly}
              variant={canClaimWeekly ? "default" : "outline"}
            >
              {canClaimWeekly ? "Claim Bonus! 🎉" : `${Math.ceil(100 - weeklyProgress)}% to go`}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Recent Rewards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Recent Rewards</span>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentRewards.length > 0 ? (
              recentRewards.slice(0, 5).map((reward, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                  <div className="flex items-center gap-2">
                    {getBonusTypeIcon(reward.bonusType)}
                    <span className="capitalize">{reward.activity.replace('_', ' ')}</span>
                    {reward.multiplier > 1 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {reward.multiplier.toFixed(1)}x
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-green-600">
                      +{formatReward(reward.tonReward)} TON
                    </div>
                    <div className="text-blue-600">
                      +{formatReward(reward.audioReward)} $AUDIO
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-muted-foreground py-4">
                Start earning rewards by using the platform!
              </div>
            )}
          </div>
        </div>

        {/* Next Milestone */}
        <div className="text-center p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-dashed border-primary/30">
          <div className="text-xs text-muted-foreground mb-1">Next Milestone</div>
          <div className="text-sm font-medium">
            Reach {rewardStats.nextRewardAt} total activities for tier upgrade
          </div>
        </div>
      </CardContent>
    </Card>
  );
};