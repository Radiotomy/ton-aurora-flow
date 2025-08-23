import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Crown,
  Users,
  Music,
  Settings,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Star,
  Zap,
  Shield,
  Gift
} from 'lucide-react';

interface FanClubTier {
  id?: string;
  name: string;
  price: number;
  duration: number;
  benefits: string[];
  maxSupply?: number;
  currentSupply?: number;
  color: string;
  isActive: boolean;
}

interface FanClubManagementProps {
  artistId?: string;
}

export const FanClubManagement: React.FC<FanClubManagementProps> = ({ artistId }) => {
  const [fanClubTiers, setFanClubTiers] = useState<FanClubTier[]>([
    {
      name: 'bronze',
      price: 5,
      duration: 30,
      benefits: ['Exclusive unreleased tracks', 'Community Discord access'],
      color: 'orange',
      isActive: true
    },
    {
      name: 'silver', 
      price: 15,
      duration: 30,
      benefits: ['All Bronze benefits', 'Early releases', 'Voice chat access'],
      color: 'gray',
      isActive: true
    },
    {
      name: 'gold',
      price: 35,
      duration: 30, 
      benefits: ['All Silver benefits', 'VIP events', 'Direct messaging'],
      color: 'yellow',
      isActive: true
    }
  ]);
  
  const [selectedTier, setSelectedTier] = useState<FanClubTier | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const [fanClubStats, setFanClubStats] = useState({
    totalMembers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFanClubStats();
    }
  }, [isAuthenticated, user]);

  const loadFanClubStats = async () => {
    try {
      // Get user profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user?.id)
        .maybeSingle();

      if (!profile) return;

      // Load fan club memberships for this artist (using profile.id as artist identifier)
      const { data: memberships } = await supabase
        .from('fan_club_memberships')
        .select('*')
        .eq('artist_id', profile.id);

      const totalMembers = memberships?.length || 0;
      const activeSubscriptions = memberships?.filter(m => 
        new Date(m.expires_at || '') > new Date()
      ).length || 0;

      // Calculate monthly revenue (mock calculation)
      const monthlyRevenue = fanClubTiers.reduce((sum, tier) => {
        const tierMembers = memberships?.filter(m => m.membership_tier === tier.name).length || 0;
        return sum + (tierMembers * tier.price);
      }, 0);

      setFanClubStats({
        totalMembers,
        monthlyRevenue,
        activeSubscriptions,
        churnRate: Math.max(0, ((totalMembers - activeSubscriptions) / Math.max(totalMembers, 1)) * 100)
      });

    } catch (error) {
      console.error('Error loading fan club stats:', error);
    }
  };

  const handleCreateTier = () => {
    const newTier: FanClubTier = {
      name: 'custom',
      price: 10,
      duration: 30,
      benefits: ['Custom benefits'],
      color: 'purple',
      isActive: true
    };
    setSelectedTier(newTier);
    setIsEditMode(true);
  };

  const handleEditTier = (tier: FanClubTier) => {
    setSelectedTier({ ...tier });
    setIsEditMode(true);
  };

  const handleSaveTier = () => {
    if (!selectedTier) return;

    const tierIndex = fanClubTiers.findIndex(t => t.name === selectedTier.name);
    if (tierIndex >= 0) {
      // Update existing tier
      const updatedTiers = [...fanClubTiers];
      updatedTiers[tierIndex] = selectedTier;
      setFanClubTiers(updatedTiers);
    } else {
      // Add new tier
      setFanClubTiers([...fanClubTiers, selectedTier]);
    }

    setSelectedTier(null);
    setIsEditMode(false);
    
    toast({
      title: "Tier Updated",
      description: "Fan club tier has been successfully updated.",
    });
  };

  const handleDeleteTier = (tierName: string) => {
    setFanClubTiers(fanClubTiers.filter(t => t.name !== tierName));
    toast({
      title: "Tier Deleted",
      description: "Fan club tier has been removed.",
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim() && selectedTier) {
      setSelectedTier({
        ...selectedTier,
        benefits: [...selectedTier.benefits, newBenefit.trim()]
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    if (selectedTier) {
      setSelectedTier({
        ...selectedTier,
        benefits: selectedTier.benefits.filter((_, i) => i !== index)
      });
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'platinum': return Crown;
      case 'gold': return Star;
      case 'silver': return Zap;
      case 'bronze': return Music;
      default: return Shield;
    }
  };

  const getTierColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      orange: 'bg-orange-500/20 text-orange-400 border-orange-400/20',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-400/20',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/20',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-400/20',
    };
    return colorMap[color] || 'bg-muted';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-aurora" />
              <div>
                <p className="text-2xl font-bold">{fanClubStats.totalMembers}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{fanClubStats.monthlyRevenue} TON</p>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{fanClubStats.activeSubscriptions}</p>
                <p className="text-sm text-muted-foreground">Active Subs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{fanClubStats.churnRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tiers" className="space-y-6">
        <TabsList className="glass-panel">
          <TabsTrigger value="tiers">Membership Tiers</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="content">Exclusive Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Fan Club Tiers</h3>
            <Button onClick={handleCreateTier} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fanClubTiers.map((tier) => {
              const TierIcon = getTierIcon(tier.name);
              return (
                <Card key={tier.name} className={`glass-panel ${getTierColorClass(tier.color)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-current/20">
                          <TierIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{tier.name} Tier</h4>
                          <p className="text-sm opacity-80">{tier.price} TON/month</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTier(tier)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTier(tier.name)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {tier.benefits.slice(0, 3).map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Star className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{benefit}</span>
                        </div>
                      ))}
                      {tier.benefits.length > 3 && (
                        <p className="text-xs opacity-80">+{tier.benefits.length - 3} more benefits</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Badge variant={tier.isActive ? "default" : "secondary"}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="opacity-80">
                        {tier.currentSupply || 0} members
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tier Edit Modal */}
          {isEditMode && selectedTier && (
            <Card className="glass-panel border-aurora">
              <CardHeader>
                <CardTitle>
                  {fanClubTiers.find(t => t.name === selectedTier.name) ? 'Edit Tier' : 'Create New Tier'}
                </CardTitle>
                <CardDescription>
                  Configure your fan club membership tier details and benefits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tierName">Tier Name</Label>
                    <Input
                      id="tierName"
                      value={selectedTier.name}
                      onChange={(e) => setSelectedTier({...selectedTier, name: e.target.value})}
                      placeholder="e.g., Gold, VIP, Premium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tierPrice">Price (TON/month)</Label>
                    <Input
                      id="tierPrice"
                      type="number"
                      step="0.1"
                      value={selectedTier.price}
                      onChange={(e) => setSelectedTier({...selectedTier, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tierColor">Tier Color</Label>
                  <Select
                    value={selectedTier.color}
                    onValueChange={(value) => setSelectedTier({...selectedTier, color: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orange">Orange (Bronze)</SelectItem>
                      <SelectItem value="gray">Gray (Silver)</SelectItem>
                      <SelectItem value="yellow">Yellow (Gold)</SelectItem>
                      <SelectItem value="purple">Purple (Platinum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Benefits</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={benefit} readOnly className="flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        placeholder="Add new benefit..."
                        onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                      />
                      <Button onClick={addBenefit} size="icon" className="h-8 w-8">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="tierActive"
                    checked={selectedTier.isActive}
                    onCheckedChange={(checked) => setSelectedTier({...selectedTier, isActive: checked})}
                  />
                  <Label htmlFor="tierActive">Tier Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTier} className="flex-1">
                    Save Tier
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedTier(null);
                      setIsEditMode(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Fan Club Members</CardTitle>
              <CardDescription>Manage your fan club community and memberships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Member Management Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced member management features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Exclusive Content</CardTitle>
              <CardDescription>Manage content available to your fan club members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Exclusive Content Tools</h3>
                <p className="text-muted-foreground">
                  Content management and gating features are being developed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Fan Club Settings</CardTitle>
              <CardDescription>Configure your fan club preferences and automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Settings</h3>
                <p className="text-muted-foreground">
                  Fan club automation and advanced settings will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FanClubManagement;