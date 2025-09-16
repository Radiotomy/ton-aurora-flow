import { useState, useEffect, useCallback } from 'react';
import { AudioTokenService, AudioTokenBalance, AudioReward, AudioGovernanceProposal } from '@/services/audioTokenService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useAudioToken = () => {
  const { profile } = useAuth();
  const [balance, setBalance] = useState<AudioTokenBalance>({
    balance: 0,
    total_earnings: 0,
    pending_rewards: 0,
  });
  const [rewards, setRewards] = useState<AudioReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      const audioBalance = await AudioTokenService.getAudioBalance(profile.id);
      setBalance(audioBalance);
    } catch (error) {
      console.error('Error fetching $AUDIO balance:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchRewards = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const audioRewards = await AudioTokenService.getAudioRewards(profile.id);
      setRewards(audioRewards);
    } catch (error) {
      console.error('Error fetching $AUDIO rewards:', error);
    }
  }, [profile?.id]);

  const claimRewards = useCallback(async (rewardIds: string[]) => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      const result = await AudioTokenService.claimAudioRewards(profile.id, rewardIds);
      
      toast({
        title: "Rewards Claimed",
        description: `Successfully claimed ${result.claimed} $AUDIO tokens`,
      });

      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const stakeTokens = useCallback(async (amount: number) => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      await AudioTokenService.stakeAudioTokens(profile.id, amount);
      
      toast({
        title: "Tokens Staked",
        description: `Successfully staked ${amount} $AUDIO tokens`,
      });

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Staking Failed",
        description: error instanceof Error ? error.message : "Failed to stake tokens",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const unstakeTokens = useCallback(async (amount: number) => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      await AudioTokenService.unstakeAudioTokens(profile.id, amount);
      
      toast({
        title: "Tokens Unstaked",
        description: `Successfully unstaked ${amount} $AUDIO tokens`,
      });

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Unstaking Failed",
        description: error instanceof Error ? error.message : "Failed to unstake tokens",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchBalance();
    fetchRewards();
  }, [fetchBalance, fetchRewards, refreshTrigger]);

  return {
    balance,
    rewards,
    loading,
    claimRewards,
    stakeTokens,
    unstakeTokens,
    refreshBalance: () => setRefreshTrigger(prev => prev + 1),
  };
};

export const useAudioGovernance = () => {
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<AudioGovernanceProposal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const governanceProposals = await AudioTokenService.getGovernanceProposals();
      setProposals(governanceProposals);
    } catch (error) {
      console.error('Error fetching governance proposals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const vote = useCallback(async (
    proposalId: string,
    vote: 'yes' | 'no',
    votingPower: number
  ) => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      await AudioTokenService.voteOnProposal(profile.id, proposalId, vote, votingPower);
      
      toast({
        title: "Vote Submitted",
        description: `Your vote has been recorded with ${votingPower} voting power`,
      });

      fetchProposals(); // Refresh proposals
    } catch (error) {
      toast({
        title: "Voting Failed",
        description: error instanceof Error ? error.message : "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, fetchProposals]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    loading,
    vote,
    refreshProposals: fetchProposals,
  };
};