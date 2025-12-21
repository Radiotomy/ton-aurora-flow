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

  // Validate transaction parameters server-side before constructing transaction
  const validateTransactionParams = useCallback(async (params: {
    artistId: string;
    artistWalletAddress: string;
    amount: number;
    transactionType: 'tip' | 'nft_purchase' | 'fan_club_membership' | 'event_ticket';
    metadata?: Record<string, unknown>;
  }) => {
    const { data, error } = await supabase.functions.invoke('validate-transaction-params', {
      body: params
    });

    if (error) {
      console.error('Transaction validation error:', error);
      throw new Error('Transaction validation failed');
    }

    if (!data?.validated) {
      throw new Error(data?.error || 'Transaction validation failed');
    }

    return data;
  }, []);

  // Fetch artist wallet address from database
  const fetchArtistWallet = useCallback(async (artistId: string): Promise<string | null> => {
    // First try to find by profile ID
    const { data: profileById } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', artistId)
      .single();

    if (profileById?.wallet_address) {
      return profileById.wallet_address;
    }

    // If not found by ID, it might be an external artist ID - return null
    return null;
  }, []);

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
      try {
        // Fetch artist wallet address from database
        const artistWalletAddress = await fetchArtistWallet(artistId);
        
        if (!artistWalletAddress) {
          toast({
            title: "Unable to tip",
            description: "Artist wallet address not found. They may not have set up their wallet yet.",
            variant: "destructive",
          });
          return;
        }

        // Validate transaction parameters server-side
        const validatedParams = await validateTransactionParams({
          artistId,
          artistWalletAddress,
          amount: tipAmount,
          transactionType: 'tip',
          metadata: { trackId }
        });

        // Build transaction with validated parameters
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
          messages: [
            {
              address: validatedParams.artistWalletAddress,
              amount: (validatedParams.amount * 1e9).toString(), // Convert TON to nanoTON
              payload: `Tip for track ${trackId}`,
            },
          ],
        };

        const result = await sendTransaction(transaction);
        if (result) {
          // Record the tip in database
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
        }
      } catch (error) {
        console.error('Error processing tip:', error);
        toast({
          title: "Tip failed",
          description: error instanceof Error ? error.message : "Failed to process tip",
          variant: "destructive",
        });
      }
    } else {
      // Simple like without tip
      toast({
        title: "Track liked!",
        description: "Added to your liked tracks",
      });
    }
  }, [isConnected, profile, sendTransaction, fetchArtistWallet, validateTransactionParams]);

  // Collect NFT version of track
  const collectTrack = useCallback(async (trackId: string, nftContractAddress: string, price: number) => {
    if (!isConnected) {
      toast({
        title: "Connect your wallet",
        description: "Connect your TON wallet to collect NFT tracks",
      });
      return;
    }

    try {
      // Validate transaction parameters server-side
      const validatedParams = await validateTransactionParams({
        artistId: nftContractAddress, // Use contract address as artist ID for NFT purchases
        artistWalletAddress: nftContractAddress,
        amount: price,
        transactionType: 'nft_purchase',
        metadata: { trackId }
      });

      // Send payment for NFT with validated parameters
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: validatedParams.artistWalletAddress,
            amount: (validatedParams.amount * 1e9).toString(), // Convert TON to nanoTON
            payload: `Purchase NFT ${trackId}`,
          },
        ],
      };

      const result = await sendTransaction(transaction);
      if (result) {
        // Record the collection in database
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
      }
    } catch (error) {
      console.error('Error collecting NFT:', error);
      toast({
        title: "Collection failed",
        description: error instanceof Error ? error.message : "Failed to collect NFT",
        variant: "destructive",
      });
    }
  }, [isConnected, profile, sendTransaction, validateTransactionParams]);

  // Share track with referral benefits
  const shareTrack = useCallback(async (trackId: string) => {
    // Use profile ID for referral tracking instead of exposing wallet address
    const referralId = profile?.id || '';
    const shareUrl = `${window.location.origin}?track=${encodeURIComponent(trackId)}&ref=${encodeURIComponent(referralId)}`;
    
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