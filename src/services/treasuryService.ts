import { supabase } from '@/integrations/supabase/client';

export interface TreasuryBalance {
  token_type: string;
  balance: number;
  allocated_to_rewards: number;
  reserved_amount: number;
  last_funded_at: string | null;
}

export interface TreasuryMovement {
  id: string;
  movement_type: string;
  token_type: string;
  amount: number;
  from_source: string | null;
  to_destination: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface RewardCap {
  reward_type: string;
  max_per_user: number;
  max_daily_platform: number;
  current_daily_used: number;
  is_active: boolean;
}

export interface BudgetCheckResult {
  can_distribute: boolean;
  reason?: string;
  treasury_balance?: number;
  user_claimed?: number;
  daily_used?: number;
  user_limit?: number;
  daily_limit?: number;
}

export interface DistributionResult {
  success: boolean;
  amount?: number;
  reward_type?: string;
  error?: string;
  treasury_balance?: number;
}

const SUPABASE_URL = 'https://cpjjaglmqvcwpzrdoyul.supabase.co';

export class TreasuryService {
  /**
   * Check if a reward can be distributed based on budget and caps
   */
  static async checkBudget(
    profileId: string,
    amount: number,
    rewardType: string
  ): Promise<BudgetCheckResult> {
    try {
      const { data, error } = await supabase.rpc('check_reward_budget', {
        p_profile_id: profileId,
        p_amount: amount,
        p_reward_type: rewardType
      });

      if (error) {
        console.error('[TreasuryService] Budget check error:', error);
        return { can_distribute: false, reason: error.message };
      }

      return data as unknown as BudgetCheckResult;
    } catch (error) {
      console.error('[TreasuryService] Budget check failed:', error);
      return { can_distribute: false, reason: 'Budget check failed' };
    }
  }

  /**
   * Distribute a reward to a user (calls edge function for security)
   */
  static async distributeReward(
    profileId: string,
    amount: number,
    rewardType: 'welcome_bonus' | 'referral' | 'first_tip' | 'first_mint' | 'activity' | 'achievement',
    activityProof?: { type: string; reference_id?: string }
  ): Promise<DistributionResult> {
    try {
      // First check budget locally
      const budgetCheck = await this.checkBudget(profileId, amount, rewardType);
      
      if (!budgetCheck.can_distribute) {
        return { 
          success: false, 
          error: budgetCheck.reason || 'Budget check failed' 
        };
      }

      // Call edge function for secure distribution
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/distribute-rewards?action=distribute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profileId,
            amount,
            reward_type: rewardType,
            activity_proof: activityProof
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Distribution failed' };
      }

      return {
        success: true,
        amount: result.amount,
        reward_type: result.reward_type,
        treasury_balance: result.treasury_balance
      };
    } catch (error) {
      console.error('[TreasuryService] Distribution error:', error);
      return { success: false, error: 'Distribution request failed' };
    }
  }

  /**
   * Allocate platform fees to the reward pool (called after transactions)
   */
  static async allocateFees(
    feeAmount: number,
    tokenType: 'TON' | 'AUDIO',
    allocationPercentage: number = 0.5
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/treasury-allocator?action=allocate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fee_amount: feeAmount,
            token_type: tokenType,
            allocation_percentage: allocationPercentage
          })
        }
      );

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('[TreasuryService] Fee allocation error:', error);
      return false;
    }
  }

  /**
   * Get reward caps (public info)
   */
  static async getRewardCaps(): Promise<RewardCap[]> {
    try {
      const { data, error } = await supabase
        .from('reward_caps')
        .select('reward_type, max_per_user, max_daily_platform, current_daily_used, is_active');

      if (error) {
        console.error('[TreasuryService] Failed to fetch reward caps:', error);
        return [];
      }

      return (data || []) as RewardCap[];
    } catch (error) {
      console.error('[TreasuryService] Reward caps fetch error:', error);
      return [];
    }
  }

  /**
   * Get user's reward claims
   */
  static async getUserClaims(profileId: string): Promise<{
    reward_type: string;
    amount_claimed: number;
    claims_today: number;
    last_claim_at: string | null;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('user_reward_claims')
        .select('reward_type, amount_claimed, claims_today, last_claim_at')
        .eq('profile_id', profileId);

      if (error) {
        console.error('[TreasuryService] Failed to fetch user claims:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[TreasuryService] User claims fetch error:', error);
      return [];
    }
  }

  /**
   * Check if user can claim a specific reward type
   */
  static async canClaimReward(
    profileId: string,
    rewardType: string,
    amount: number
  ): Promise<{ canClaim: boolean; reason?: string; remaining?: number }> {
    try {
      const [caps, claims] = await Promise.all([
        this.getRewardCaps(),
        this.getUserClaims(profileId)
      ]);

      const cap = caps.find(c => c.reward_type === rewardType);
      if (!cap) {
        return { canClaim: false, reason: 'Reward type not configured' };
      }

      if (!cap.is_active) {
        return { canClaim: false, reason: 'This reward is currently disabled' };
      }

      const userClaim = claims.find(c => c.reward_type === rewardType);
      const alreadyClaimed = userClaim?.amount_claimed || 0;
      const remaining = cap.max_per_user - alreadyClaimed;

      if (remaining <= 0) {
        return { canClaim: false, reason: 'You have reached the maximum for this reward', remaining: 0 };
      }

      if (amount > remaining) {
        return { canClaim: false, reason: `Only ${remaining.toFixed(2)} AUDIO remaining for this reward`, remaining };
      }

      // Check daily platform limit
      if (cap.current_daily_used >= cap.max_daily_platform) {
        return { canClaim: false, reason: 'Daily platform reward limit reached. Try again tomorrow!' };
      }

      return { canClaim: true, remaining };
    } catch (error) {
      console.error('[TreasuryService] Claim check error:', error);
      return { canClaim: false, reason: 'Unable to verify claim eligibility' };
    }
  }

  // ============ ADMIN FUNCTIONS ============

  /**
   * Get treasury status (admin only)
   */
  static async getTreasuryStatus(authToken: string): Promise<{
    treasury: TreasuryBalance[];
    reward_caps: RewardCap[];
    recent_movements: TreasuryMovement[];
  } | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/treasury-allocator?action=status`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        }
      );

      if (!response.ok) {
        console.error('[TreasuryService] Failed to fetch treasury status');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[TreasuryService] Treasury status error:', error);
      return null;
    }
  }

  /**
   * Manual deposit to treasury (admin only)
   */
  static async manualDeposit(
    authToken: string,
    amount: number,
    tokenType: 'TON' | 'AUDIO',
    allocateToRewards: boolean = true,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/treasury-allocator?action=manual-deposit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            token_type: tokenType,
            allocate_to_rewards: allocateToRewards,
            notes
          })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('[TreasuryService] Manual deposit error:', error);
      return { success: false, error: 'Deposit request failed' };
    }
  }

  /**
   * Bulk distribute rewards (admin only)
   */
  static async bulkDistribute(
    authToken: string,
    distributions: Array<{
      profile_id: string;
      amount: number;
      reward_type: string;
    }>
  ): Promise<{
    success: boolean;
    total: number;
    succeeded: number;
    failed: number;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/distribute-rewards?action=bulk-distribute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ distributions })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          total: distributions.length, 
          succeeded: 0, 
          failed: distributions.length,
          error: result.error 
        };
      }

      return {
        success: true,
        total: result.total,
        succeeded: result.succeeded,
        failed: result.failed
      };
    } catch (error) {
      console.error('[TreasuryService] Bulk distribute error:', error);
      return { 
        success: false, 
        total: distributions.length, 
        succeeded: 0, 
        failed: distributions.length,
        error: 'Bulk distribution request failed' 
      };
    }
  }

  /**
   * Update reward cap (admin only, via direct database)
   */
  static async updateRewardCap(
    rewardType: string,
    updates: Partial<{
      max_per_user: number;
      max_daily_platform: number;
      is_active: boolean;
    }>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reward_caps')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('reward_type', rewardType);

      if (error) {
        console.error('[TreasuryService] Failed to update reward cap:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TreasuryService] Reward cap update error:', error);
      return false;
    }
  }
}
