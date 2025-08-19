import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { Crown, Users, Clock, Star, Zap, Music } from 'lucide-react';

interface FanClubCardProps {
  artistId: string;
  artistName: string;
  artistAvatar: string;
  membership?: {
    tier: string;
    expiresAt: string;
    nftTokenId?: string;
  };
  stats: {
    totalMembers: number;
    monthlyListeners: number;
    exclusiveContent: number;
  };
  tiers: Array<{
    name: string;
    price: number;
    duration: number; // in months
    benefits: string[];
    maxSupply?: number;
    currentSupply?: number;
  }>;
}

const getTierIcon = (tierName: string) => {
  switch (tierName.toLowerCase()) {
    case 'vip': return Crown;
    case 'premium': return Star;
    case 'supporter': return Zap;
    default: return Music;
  }
};

const getTierColor = (tierName: string) => {
  switch (tierName.toLowerCase()) {
    case 'vip': return 'bg-aurora';
    case 'premium': return 'bg-primary';
    case 'supporter': return 'bg-secondary';
    default: return 'bg-muted';
  }
};

export const FanClubCard: React.FC<FanClubCardProps> = ({ 
  artistId, 
  artistName, 
  artistAvatar, 
  membership,
  stats,
  tiers 
}) => {
  const [selectedTier, setSelectedTier] = useState(tiers[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, sendTransaction, connectWallet } = useWeb3();
  const { toast } = useToast();

  const handleJoinFanClub = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsProcessing(true);
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t', // Fan club contract
          amount: (selectedTier.price * 1e9).toString(),
          payload: btoa(JSON.stringify({
            method: 'join_fan_club',
            params: {
              artist_id: artistId,
              tier: selectedTier.name,
              duration: selectedTier.duration
            }
          }))
        }]
      };

      await sendTransaction(transaction);
      
      toast({
        title: "Welcome to the Fan Club! 🎉",
        description: `You're now a ${selectedTier.name} member of ${artistName}'s fan club`,
      });
      
    } catch (error) {
      console.error('Fan club join failed:', error);
      toast({
        title: "Join Failed",
        description: "Please try again or check your wallet connection.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isExpiringSoon = membership && new Date(membership.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className="glass-panel p-6 space-y-6">
      {/* Artist Header */}
      <div className="flex items-center gap-4">
        <img 
          src={artistAvatar} 
          alt={artistName}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="text-xl font-bold">{artistName}</h3>
          <p className="text-muted-foreground">Fan Club</p>
          {membership && (
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getTierColor(membership.tier)}>
                {membership.tier.toUpperCase()} MEMBER
              </Badge>
              {isExpiringSoon && (
                <Badge variant="destructive">Expires Soon</Badge>
              )}
            </div>
          )}
        </div>
        <Crown className="h-8 w-8 text-primary" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalMembers}</div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Users className="h-3 w-3" />
            Members
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.monthlyListeners}</div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Music className="h-3 w-3" />
            Monthly
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.exclusiveContent}</div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Star className="h-3 w-3" />
            Exclusive
          </div>
        </div>
      </div>

      {/* Current Membership Status */}
      {membership ? (
        <Card className="glass-panel-active p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                {React.createElement(getTierIcon(membership.tier), { className: "h-5 w-5 text-primary" })}
              </div>
              <div>
                <div className="font-semibold">{membership.tier} Member</div>
                <div className="text-sm text-muted-foreground">
                  Expires {new Date(membership.expiresAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {membership.nftTokenId && (
              <Badge variant="outline">
                NFT #{membership.nftTokenId}
              </Badge>
            )}
          </div>
          
          {isExpiringSoon && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Membership expiring soon</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Renew Membership
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Membership Tiers */}
          <div className="space-y-3">
            <h4 className="font-semibold">Choose Your Tier</h4>
            <div className="space-y-2">
              {tiers.map((tier) => {
                const TierIcon = getTierIcon(tier.name);
                const isSelected = selectedTier.name === tier.name;
                const isSoldOut = tier.maxSupply && tier.currentSupply && tier.currentSupply >= tier.maxSupply;
                
                return (
                  <Card 
                    key={tier.name}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary glass-panel-active' : 'glass-panel hover:glass-panel-hover'
                    } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isSoldOut && setSelectedTier(tier)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getTierColor(tier.name)}/20`}>
                            <TierIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{tier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tier.duration} month{tier.duration > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{tier.price} TON</div>
                          {tier.maxSupply && (
                            <div className="text-xs text-muted-foreground">
                              {tier.currentSupply || 0}/{tier.maxSupply}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {tier.maxSupply && (
                        <div className="mb-3">
                          <Progress 
                            value={((tier.currentSupply || 0) / tier.maxSupply) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {tier.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Star className="h-3 w-3 text-primary flex-shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                      
                      {isSoldOut && (
                        <div className="mt-3 text-center">
                          <Badge variant="destructive">Sold Out</Badge>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Join Button */}
          <Button 
            onClick={handleJoinFanClub}
            disabled={isProcessing}
            className="w-full"
            variant="aurora"
          >
            {isProcessing ? 'Processing...' : isConnected ? `Join for ${selectedTier.price} TON` : 'Connect Wallet'}
          </Button>
        </>
      )}
    </Card>
  );
};