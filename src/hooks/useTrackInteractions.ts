import { useCallback, useRef } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useWalletStore } from '@/stores/walletStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTrackInteractions = () => {
  const { isConnected, profile, sendTransaction } = useWeb3();
  const { setProfile } = useWalletStore();
  
  // Use ref to avoid circular dependency
  const setProfileRef = useRef(setProfile);
  setProfileRef.current = setProfile;

  // Play track with Web3 benefits
  const playTrack = useCallback(async (trackId: string, artistId: string) => {
    if (isConnected && profile) {
      // Record listening history
      try {
        await supabase
          .from('listening_history')
          .insert({
            profile_id: profile.id,
            track_id: trackId,
            artist_id: artistId,
            played_at: new Date().toISOString(),
          });
      } catch (error) {
        console.error('Error recording play:', error);
      }
    }
    
    // Track playback implementation
    // This would integrate with the audio player
  }, [isConnected, profile]);

  // Like track with optional micro-tip
  const likeTrack = useCallback(async (trackId: string, artistId: string, tipAmount?: number) => {
    if (!isConnected) {
      toast({
        title: "Connect your wallet",
        description: "Connect your TON wallet to like tracks and tip artists",
      });
      return;
    }

    if (tipAmount && tipAmount > 0) {
      // Send TON tip to artist
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: artistId, // In real implementation, this would be artist's wallet
            amount: (tipAmount * 1e9).toString(), // Convert TON to nanoTON
            payload: `Tip for track ${trackId}`,
          },
        ],
      };

      const result = await sendTransaction(transaction);
      if (result) {
        // Record the tip in database
        try {
          await supabase
            .from('listening_history')
            .insert({
              profile_id: profile!.id,
              track_id: trackId,
              artist_id: artistId,
              tip_amount: tipAmount,
              played_at: new Date().toISOString(),
            });

          toast({
            title: "Tip sent!",
            description: `You tipped ${tipAmount} TON to the artist`,
          });
        } catch (error) {
          console.error('Error recording tip:', error);
        }
      }
    } else {
      // Simple like without tip
      toast({
        title: "Track liked!",
        description: "Added to your liked tracks",
      });
    }
  }, [isConnected, profile, sendTransaction]);

  // Collect NFT version of track
  const collectTrack = useCallback(async (trackId: string, nftContractAddress: string, price: number) => {
    if (!isConnected) {
      toast({
        title: "Connect your wallet",
        description: "Connect your TON wallet to collect NFT tracks",
      });
      return;
    }

    // Send payment for NFT
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      messages: [
        {
          address: nftContractAddress,
          amount: (price * 1e9).toString(), // Convert TON to nanoTON
          payload: `Purchase NFT ${trackId}`,
        },
      ],
    };

    const result = await sendTransaction(transaction);
    if (result) {
      // Record the collection in database
      try {
        await supabase
          .from('track_collections')
          .insert({
            profile_id: profile!.id,
            track_id: trackId,
            nft_contract_address: nftContractAddress,
            purchase_price: price,
            collected_at: new Date().toISOString(),
          });

        // Update user reputation
        if (profile) {
          const updatedProfile = {
            ...profile,
            reputation_score: profile.reputation_score + 10, // Increase reputation for collecting
          };
          
          await supabase
            .from('profiles')
            .update({ reputation_score: updatedProfile.reputation_score })
            .eq('id', profile.id);
            
          setProfileRef.current(updatedProfile);
        }

        toast({
          title: "NFT Collected!",
          description: "Track NFT added to your collection",
        });
      } catch (error) {
        console.error('Error recording collection:', error);
      }
    }
  }, [isConnected, profile, sendTransaction]);

  // Share track with referral benefits
  const shareTrack = useCallback(async (trackId: string) => {
    const shareUrl = `${window.location.origin}?track=${trackId}&ref=${profile?.wallet_address}`;
    
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this track!',
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link to earn referral rewards",
      });
    }
  }, [profile]);

  return {
    playTrack,
    likeTrack,
    collectTrack,
    shareTrack,
    isConnected,
  };
};