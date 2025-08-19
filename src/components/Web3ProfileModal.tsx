import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/hooks/useWeb3';
import { useWalletStore } from '@/stores/walletStore';
import {
  User,
  Wallet,
  Trophy,
  Music,
  Users,
  Settings,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Web3ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const Web3ProfileModal: React.FC<Web3ProfileModalProps> = ({
  open,
  onClose,
}) => {
  const { profile, shortAddress, disconnectWallet } = useWeb3();
  const { assets, fanClubMemberships } = useWalletStore();

  const copyAddress = async () => {
    if (profile?.wallet_address) {
      await navigator.clipboard.writeText(profile.wallet_address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{profile.display_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{shortAddress}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {profile.ton_dns_name && (
                <Badge variant="secondary" className="mt-1">
                  {profile.ton_dns_name}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="fanclubs">Fan Clubs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Reputation</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {profile.reputation_score}
                </span>
              </div>
              
              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">NFTs Owned</span>
                </div>
                <span className="text-2xl font-bold text-accent">
                  {assets.filter(a => a.asset_type === 'nft').length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Collected "Neon Dreams"</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="outline">2.5 TON</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Joined "Echo Luna Fan Club"</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <Badge variant="outline">Gold Tier</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="collection" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {assets.filter(a => a.asset_type === 'nft').map((nft) => (
                <div key={nft.id} className="glass-panel p-4 rounded-lg">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-3"></div>
                  <h4 className="font-medium text-sm truncate">Music NFT #{nft.token_id}</h4>
                  <p className="text-xs text-muted-foreground">Contract: {nft.contract_address?.slice(0, 10)}...</p>
                </div>
              ))}
              
              {assets.filter(a => a.asset_type === 'nft').length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No NFTs in your collection yet</p>
                  <p className="text-sm text-muted-foreground">Collect music NFTs to see them here</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="fanclubs" className="space-y-4">
            <div className="space-y-3">
              {fanClubMemberships.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full"></div>
                    <div>
                      <h4 className="font-medium">Artist #{membership.artist_id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {membership.membership_tier} member
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ))}
              
              {fanClubMemberships.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No fan club memberships</p>
                  <p className="text-sm text-muted-foreground">Join fan clubs to access exclusive content</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Wallet Connection</h4>
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">TON Wallet</p>
                      <p className="text-sm text-muted-foreground">{shortAddress}</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Profile Settings</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};