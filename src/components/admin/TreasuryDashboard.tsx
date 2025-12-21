import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Settings, 
  History,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Coins,
  Shield,
  Pause,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { TreasuryService, TreasuryBalance, TreasuryMovement, RewardCap } from '@/services/treasuryService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TreasuryStats {
  treasury: TreasuryBalance[];
  reward_caps: RewardCap[];
  recent_movements: TreasuryMovement[];
}

const TreasuryDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Deposit modal state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositToken, setDepositToken] = useState<'TON' | 'AUDIO'>('AUDIO');
  const [depositNotes, setDepositNotes] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Cap editing state
  const [editingCap, setEditingCap] = useState<string | null>(null);
  const [capValues, setCapValues] = useState<Record<string, { max_per_user: number; max_daily_platform: number; is_active: boolean }>>({});

  useEffect(() => {
    checkAdminAndFetch();
    
    // Set up real-time subscription for treasury movements
    const channel = supabase
      .channel('treasury-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'treasury_movements'
        },
        (payload) => {
          console.log('[TreasuryDashboard] New movement:', payload);
          // Refresh data on new movement
          fetchTreasuryStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setAuthToken(session.access_token);

      // Check admin role
      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });

      setIsAdmin(!!roleData);

      if (roleData) {
        await fetchTreasuryStatus(session.access_token);
      }
    } catch (error) {
      console.error('[TreasuryDashboard] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTreasuryStatus = async (token?: string) => {
    const accessToken = token || authToken;
    if (!accessToken) return;

    try {
      const data = await TreasuryService.getTreasuryStatus(accessToken);
      if (data) {
        setStats(data);
        // Initialize cap values
        const caps: Record<string, any> = {};
        data.reward_caps.forEach(cap => {
          caps[cap.reward_type] = {
            max_per_user: cap.max_per_user,
            max_daily_platform: cap.max_daily_platform,
            is_active: cap.is_active
          };
        });
        setCapValues(caps);
      }
    } catch (error) {
      console.error('[TreasuryDashboard] Fetch error:', error);
    }
  };

  const handleDeposit = async () => {
    if (!authToken || !depositAmount || parseFloat(depositAmount) <= 0) return;

    setIsDepositing(true);
    try {
      const result = await TreasuryService.manualDeposit(
        authToken,
        parseFloat(depositAmount),
        depositToken,
        true,
        depositNotes || undefined
      );

      if (result.success) {
        toast({
          title: 'Deposit Successful',
          description: `${depositAmount} ${depositToken} added to treasury`,
        });
        setDepositOpen(false);
        setDepositAmount('');
        setDepositNotes('');
        await fetchTreasuryStatus();
      } else {
        toast({
          title: 'Deposit Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process deposit',
        variant: 'destructive',
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleUpdateCap = async (rewardType: string) => {
    const values = capValues[rewardType];
    if (!values) return;

    try {
      const success = await TreasuryService.updateRewardCap(rewardType, values);
      
      if (success) {
        toast({
          title: 'Cap Updated',
          description: `${rewardType} caps updated successfully`,
        });
        setEditingCap(null);
        await fetchTreasuryStatus();
      } else {
        toast({
          title: 'Update Failed',
          description: 'Could not update reward cap',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update cap',
        variant: 'destructive',
      });
    }
  };

  const toggleCapActive = async (rewardType: string, currentActive: boolean) => {
    try {
      const success = await TreasuryService.updateRewardCap(rewardType, {
        is_active: !currentActive
      });

      if (success) {
        toast({
          title: currentActive ? 'Reward Paused' : 'Reward Activated',
          description: `${rewardType} is now ${currentActive ? 'paused' : 'active'}`,
        });
        await fetchTreasuryStatus();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle reward status',
        variant: 'destructive',
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'fee_collection': return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case 'reward_payout': return <ArrowUpFromLine className="h-4 w-4 text-orange-500" />;
      case 'manual_deposit': return <Coins className="h-4 w-4 text-blue-500" />;
      case 'reward_allocation': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default: return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'fee_collection': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Fee</Badge>;
      case 'reward_payout': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">Payout</Badge>;
      case 'manual_deposit': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Deposit</Badge>;
      case 'reward_allocation': return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">Allocation</Badge>;
      default: return <Badge variant="outline">System</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-4 py-8">
          <Shield className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Admin Access Required</h3>
            <p className="text-muted-foreground">You don't have permission to view the treasury dashboard.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const audioTreasury = stats?.treasury.find(t => t.token_type === 'AUDIO');
  const tonTreasury = stats?.treasury.find(t => t.token_type === 'TON');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Treasury Dashboard
          </h2>
          <p className="text-muted-foreground">Manage platform funds and reward distribution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchTreasuryStatus()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Manual Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Treasury Deposit</DialogTitle>
                <DialogDescription>
                  Add funds directly to the treasury. All deposits are logged for audit purposes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Token Type</Label>
                  <Select value={depositToken} onValueChange={(v) => setDepositToken(v as 'TON' | 'AUDIO')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUDIO">AUDIO</SelectItem>
                      <SelectItem value="TON">TON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Reason for deposit"
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
                <Button onClick={handleDeposit} disabled={isDepositing || !depositAmount}>
                  {isDepositing ? 'Processing...' : 'Deposit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Coins className="h-4 w-4" /> AUDIO Treasury
              </CardDescription>
              <CardTitle className="text-2xl">
                {audioTreasury?.balance.toLocaleString() || '0'} <span className="text-base text-muted-foreground">AUDIO</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Reward Pool: <span className="text-foreground font-medium">{audioTreasury?.allocated_to_rewards.toLocaleString() || '0'}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> TON Treasury
              </CardDescription>
              <CardTitle className="text-2xl">
                {tonTreasury?.balance.toLocaleString() || '0'} <span className="text-base text-muted-foreground">TON</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Reward Pool: <span className="text-foreground font-medium">{tonTreasury?.allocated_to_rewards.toLocaleString() || '0'}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Active Reward Types
              </CardDescription>
              <CardTitle className="text-2xl">
                {stats?.reward_caps.filter(c => c.is_active).length || 0}
                <span className="text-base text-muted-foreground"> / {stats?.reward_caps.length || 0}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Reward programs active</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <History className="h-4 w-4" /> Recent Movements
              </CardDescription>
              <CardTitle className="text-2xl">{stats?.recent_movements.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Last 50 transactions</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="caps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="caps" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Reward Caps
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Movement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caps">
          <Card>
            <CardHeader>
              <CardTitle>Reward Cap Management</CardTitle>
              <CardDescription>Configure limits for each reward type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.reward_caps.map((cap) => (
                  <motion.div
                    key={cap.reward_type}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleCapActive(cap.reward_type, cap.is_active)}
                        >
                          {cap.is_active ? (
                            <Pause className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <div>
                          <div className="font-medium capitalize flex items-center gap-2">
                            {cap.reward_type.replace(/_/g, ' ')}
                            {cap.is_active ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted">Paused</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Max/User: {cap.max_per_user} AUDIO · Daily Limit: {cap.max_daily_platform} AUDIO
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {cap.current_daily_used.toLocaleString()} / {cap.max_daily_platform.toLocaleString()}
                        </div>
                        <Progress 
                          value={(cap.current_daily_used / cap.max_daily_platform) * 100} 
                          className="w-32 h-2"
                        />
                      </div>
                      
                      {editingCap === cap.reward_type ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-24"
                            placeholder="Max/User"
                            value={capValues[cap.reward_type]?.max_per_user || ''}
                            onChange={(e) => setCapValues(prev => ({
                              ...prev,
                              [cap.reward_type]: {
                                ...prev[cap.reward_type],
                                max_per_user: parseFloat(e.target.value)
                              }
                            }))}
                          />
                          <Input
                            type="number"
                            className="w-24"
                            placeholder="Daily Max"
                            value={capValues[cap.reward_type]?.max_daily_platform || ''}
                            onChange={(e) => setCapValues(prev => ({
                              ...prev,
                              [cap.reward_type]: {
                                ...prev[cap.reward_type],
                                max_daily_platform: parseFloat(e.target.value)
                              }
                            }))}
                          />
                          <Button size="sm" onClick={() => handleUpdateCap(cap.reward_type)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCap(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setEditingCap(cap.reward_type)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Treasury Movement History</CardTitle>
              <CardDescription>Complete audit trail of all fund movements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {stats?.recent_movements.map((movement) => (
                    <motion.div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        {getMovementIcon(movement.movement_type)}
                        <div>
                          <div className="flex items-center gap-2">
                            {getMovementBadge(movement.movement_type)}
                            <span className="font-medium">
                              {movement.amount > 0 ? '+' : ''}{movement.amount.toLocaleString()} {movement.token_type}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {movement.from_source} → {movement.to_destination}
                            {movement.notes && <span className="ml-2">· {movement.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(movement.created_at), 'MMM d, HH:mm')}
                      </div>
                    </motion.div>
                  ))}
                  
                  {(!stats?.recent_movements || stats.recent_movements.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No treasury movements yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning Banner */}
      {audioTreasury && audioTreasury.allocated_to_rewards < 1000 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <h4 className="font-semibold text-yellow-500">Low Reward Pool Balance</h4>
              <p className="text-sm text-muted-foreground">
                The AUDIO reward pool is running low ({audioTreasury.allocated_to_rewards.toLocaleString()} AUDIO remaining). 
                Consider adding more funds to continue reward distribution.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="ml-auto border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
              onClick={() => setDepositOpen(true)}
            >
              Add Funds
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TreasuryDashboard;
