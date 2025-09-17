import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { useWalletStore } from '@/stores/walletStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { batchUpdates, throttleRAF } from '@/utils/performance';

import {
  User,
  Wallet,
  Trophy,
  Music,
  Users,
  Settings,
  Copy,
  ExternalLink,
  Edit,
  Save,
  Star,
  Crown,
  Shield
} from 'lucide-react';

interface Web3ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  auth_user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  wallet_address?: string;
  ton_dns_name?: string;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

export const Web3ProfileModal: React.FC<Web3ProfileModalProps> = ({
  open,
  onClose,
}) => {
  // Move useWeb3 to the top level to fix hooks rule violation
  const web3Data = useWeb3();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tonDnsName, setTonDnsName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs to prevent excessive re-renders and debouncing
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Performance optimized input handlers
  const debouncedSetDisplayName = useMemo(() => throttleRAF((value: string) => {
    batchUpdates(() => setDisplayName(value));
  }, 100), []);
  
  const debouncedSetBio = useMemo(() => throttleRAF((value: string) => {
    batchUpdates(() => setBio(value));
  }, 100), []);
  
  // Memoize web3 data to prevent re-renders
  const {
    isConnected,
    walletAddress,
    profile,
    loadingProfile,
    balance,
    formattedBalance,
    shortAddress,
    tonDnsName: web3TonDnsName,
    updateTonDnsName,
  } = useMemo(() => web3Data, [
    web3Data.isConnected,
    web3Data.walletAddress,
    web3Data.profile?.id,
    web3Data.loadingProfile,
    web3Data.balance,
    web3Data.tonDnsName,
  ]);
  const lastProfileLoadRef = useRef<string>();
  const debounceInputRef = useRef<NodeJS.Timeout>();
  
  const { user, isAuthenticated } = useAuth();
  const { assets, fanClubMemberships } = useWalletStore();
  const { toast } = useToast();

  // Debounced profile loading to prevent excessive calls
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    // Prevent duplicate loads
    const currentKey = `${user.id}-${open}`;
    if (lastProfileLoadRef.current === currentKey) return;
    lastProfileLoadRef.current = currentKey;
    
    setIsLoading(true);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createUserProfile();
        }
      } else {
        setUserProfile(profile);
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        setAvatarUrl(profile.avatar_url || '');
        setTonDnsName(profile.ton_dns_name || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error Loading Profile",
        description: "There was an error loading your profile information.",
        variant: "destructive"
      });
    } finally {
      // Use RAF for state updates to prevent forced reflows
      batchUpdates(() => setIsLoading(false));
    }
  }, [user?.id, open, toast]);

  useEffect(() => {
    if (open && isAuthenticated && user) {
      loadUserProfile();
    }
    
    return () => {
      clearTimeout(loadingTimeoutRef.current);
      clearTimeout(debounceInputRef.current);
    };
  }, [open, isAuthenticated, loadUserProfile]);


  const createUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([{
          auth_user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Anonymous User',
          wallet_address: walletAddress || null,
          reputation_score: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      setUserProfile(newProfile);
      setDisplayName(newProfile.display_name || '');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error Creating Profile",
        description: "There was an error setting up your profile.",
        variant: "destructive"
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return;

    setIsSaving(true);
    try {
      const updates = {
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
        ton_dns_name: tonDnsName,
        wallet_address: walletAddress || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userProfile.id);

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyAddress = async () => {
    if (userProfile?.wallet_address) {
      await navigator.clipboard.writeText(userProfile.wallet_address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="glass-panel no-hover-lift max-w-2xl">
          <DialogHeader>
            <DialogTitle>Web3 Profile</DialogTitle>
            <DialogDescription>
              {!isAuthenticated ? "Please sign in to view your profile" : "Loading your profile..."}
            </DialogDescription>
          </DialogHeader>
          {isLoading && (
            <div className="space-y-4 animate-pulse py-8">
              <div className="h-16 w-16 bg-muted rounded-full mx-auto"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel no-hover-lift max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{userProfile?.display_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {userProfile?.wallet_address ? shortAddress : "No wallet connected"}
                </span>
                {userProfile?.wallet_address && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {userProfile?.ton_dns_name && (
                  <Badge variant="secondary">
                    {userProfile.ton_dns_name}
                  </Badge>
                )}
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1" />
                  Rep: {userProfile?.reputation_score || 0}
                </Badge>
                {isConnected && (
                  <Badge variant="default">
                    <Wallet className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="fanclubs">Fan Clubs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Reputation</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {userProfile?.reputation_score || 0}
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
              <h4 className="font-medium">Profile Information</h4>
              <div className="glass-panel p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Display Name</span>
                  <span className="text-sm font-medium">{userProfile?.display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {userProfile?.bio && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Bio</span>
                    <p className="text-sm">{userProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => debouncedSetDisplayName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => debouncedSetBio(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div>
                <Label htmlFor="avatarUrl" className="text-sm font-medium">
                  Avatar URL
                </Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="tonDnsName" className="text-sm font-medium">
                  TON DNS Name
                </Label>
                <Input
                  id="tonDnsName"
                  value={tonDnsName}
                  onChange={(e) => setTonDnsName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="yourname.ton"
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Artist #{membership.artist_id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {membership.membership_tier} member
                      </p>
                      {membership.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(membership.expires_at).toLocaleDateString()}
                        </p>
                      )}
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
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/fan-clubs'}>
                    <Crown className="h-4 w-4 mr-2" />
                    Browse Fan Clubs
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};