import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TreasuryService, RewardCap, BudgetCheckResult } from '@/services/treasuryService';

interface UserClaimInfo {
  reward_type: string;
  amount_claimed: number;
  claims_today: number;
  remaining: number;
  can_claim: boolean;
}

export const useRewardBudget = (profileId: string | null) => {
  const [rewardCaps, setRewardCaps] = useState<RewardCap[]>([]);
  const [userClaims, setUserClaims] = useState<UserClaimInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetInfo = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [caps, claims] = await Promise.all([
        TreasuryService.getRewardCaps(),
        TreasuryService.getUserClaims(profileId)
      ]);

      setRewardCaps(caps);

      // Calculate user claim info with remaining amounts
      const claimInfo: UserClaimInfo[] = caps.map(cap => {
        const userClaim = claims.find(c => c.reward_type === cap.reward_type);
        const claimed = userClaim?.amount_claimed || 0;
        const remaining = Math.max(0, cap.max_per_user - claimed);

        return {
          reward_type: cap.reward_type,
          amount_claimed: claimed,
          claims_today: userClaim?.claims_today || 0,
          remaining,
          can_claim: cap.is_active && remaining > 0 && cap.current_daily_used < cap.max_daily_platform
        };
      });

      setUserClaims(claimInfo);
    } catch (err) {
      console.error('[useRewardBudget] Error fetching budget info:', err);
      setError('Failed to load reward information');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchBudgetInfo();
  }, [fetchBudgetInfo]);

  const checkBudget = useCallback(async (
    amount: number,
    rewardType: string
  ): Promise<BudgetCheckResult> => {
    if (!profileId) {
      return { can_distribute: false, reason: 'Not authenticated' };
    }

    return TreasuryService.checkBudget(profileId, amount, rewardType);
  }, [profileId]);

  const canClaimReward = useCallback((rewardType: string): { canClaim: boolean; remaining: number; reason?: string } => {
    const claimInfo = userClaims.find(c => c.reward_type === rewardType);
    const cap = rewardCaps.find(c => c.reward_type === rewardType);

    if (!claimInfo || !cap) {
      return { canClaim: false, remaining: 0, reason: 'Reward type not found' };
    }

    if (!cap.is_active) {
      return { canClaim: false, remaining: 0, reason: 'This reward is currently disabled' };
    }

    if (claimInfo.remaining <= 0) {
      return { canClaim: false, remaining: 0, reason: 'Maximum rewards claimed' };
    }

    if (cap.current_daily_used >= cap.max_daily_platform) {
      return { canClaim: false, remaining: claimInfo.remaining, reason: 'Daily limit reached' };
    }

    return { canClaim: true, remaining: claimInfo.remaining };
  }, [userClaims, rewardCaps]);

  const getRewardProgress = useCallback((rewardType: string): { 
    claimed: number; 
    max: number; 
    percentage: number;
    dailyUsed: number;
    dailyMax: number;
  } | null => {
    const claimInfo = userClaims.find(c => c.reward_type === rewardType);
    const cap = rewardCaps.find(c => c.reward_type === rewardType);

    if (!claimInfo || !cap) return null;

    return {
      claimed: claimInfo.amount_claimed,
      max: cap.max_per_user,
      percentage: (claimInfo.amount_claimed / cap.max_per_user) * 100,
      dailyUsed: cap.current_daily_used,
      dailyMax: cap.max_daily_platform
    };
  }, [userClaims, rewardCaps]);

  return {
    rewardCaps,
    userClaims,
    isLoading,
    error,
    refetch: fetchBudgetInfo,
    checkBudget,
    canClaimReward,
    getRewardProgress
  };
};

// Hook for tracking total available rewards
export const useTotalRewardsAvailable = (profileId: string | null) => {
  const { userClaims, rewardCaps, isLoading } = useRewardBudget(profileId);

  const totalAvailable = userClaims.reduce((sum, claim) => sum + claim.remaining, 0);
  const totalClaimed = userClaims.reduce((sum, claim) => sum + claim.amount_claimed, 0);
  const totalPossible = rewardCaps.reduce((sum, cap) => sum + cap.max_per_user, 0);

  return {
    totalAvailable,
    totalClaimed,
    totalPossible,
    claimPercentage: totalPossible > 0 ? (totalClaimed / totalPossible) * 100 : 0,
    isLoading
  };
};
