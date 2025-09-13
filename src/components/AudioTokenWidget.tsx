import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  ArrowUpDown, 
  Lock, 
  TrendingUp, 
  Trophy,
  Timer,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AudioTokenService, AudioTokenBalance, AudioTokenStaking } from '@/services/audioTokenService';
import { useTokenBalances } from '@/hooks/useTokenBalances';

export const AudioTokenWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshBalances } = useTokenBalances();
  const [audioBalance, setAudioBalance] = useState<AudioTokenBalance>({ balance: 0, staked: 0, earned: 0, locked: 0 });
  const [stakingPositions, setStakingPositions] = useState<AudioTokenStaking[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');

  // Conversion form
  const [convertAmount, setConvertAmount] = useState('');
  const [convertFrom, setConvertFrom] = useState<'AUDIO' | 'TON'>('TON');
  
  // Staking form
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState(30);

  useEffect(() => {
    if (user) {
      fetchAudioData();
    }
  }, [user]);

  const fetchAudioData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [balance, staking, rate] = await Promise.all([
        AudioTokenService.getAudioBalance(user.id),
        AudioTokenService.getStakingPositions(user.id),
        AudioTokenService.getConversionRate('TON', 'AUDIO')
      ]);

      setAudioBalance(balance);
      setStakingPositions(staking);
      setConversionRate(rate);
    } catch (error) {
      console.error('Error fetching AUDIO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!user || !convertAmount || Number(convertAmount) <= 0) return;

    try {
      setLoading(true);
      const toToken = convertFrom === 'AUDIO' ? 'TON' : 'AUDIO';
      
      await AudioTokenService.convertTokens(
        user.id,
        convertFrom,
        toToken,
        Number(convertAmount)
      );

      toast({
        title: "Conversion Successful",
        description: `Converted ${convertAmount} ${convertFrom} to ${toToken}`,
      });

      setConvertAmount('');
      await fetchAudioData();
      await refreshBalances();
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "Failed to convert tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!user || !stakeAmount || Number(stakeAmount) <= 0) return;

    try {
      setLoading(true);
      
      await AudioTokenService.stakeAudioTokens(
        user.id,
        Number(stakeAmount),
        stakeDuration
      );

      toast({
        title: "Staking Successful",
        description: `Staked ${stakeAmount} AUDIO tokens for ${stakeDuration} days`,
      });

      setStakeAmount('');
      await fetchAudioData();
    } catch (error) {
      toast({
        title: "Staking Failed",
        description: error instanceof Error ? error.message : "Failed to stake tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (stakeId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      await AudioTokenService.withdrawStake(user.id, stakeId);

      toast({
        title: "Withdrawal Successful",
        description: "Staked tokens and rewards have been returned to your balance",
      });

      await fetchAudioData();
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to withdraw stake",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStakingAPY = (duration: number) => {
    return duration >= 365 ? 15 : duration >= 180 ? 12 : duration >= 90 ? 8 : 5;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Coins className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Connect your wallet to view $AUDIO tokens</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          $AUDIO Token Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="convert">Convert</TabsTrigger>
            <TabsTrigger value="stake">Stake</TabsTrigger>
          </TabsList>

          <TabsContent value="balance" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Available</span>
                </div>
                <p className="text-2xl font-bold">{audioBalance.balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">AUDIO</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Staked</span>
                </div>
                <p className="text-2xl font-bold">{audioBalance.staked.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">AUDIO</p>
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Earned</span>
                </div>
                <p className="text-2xl font-bold">{audioBalance.earned.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">AUDIO</p>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold">
                  {(audioBalance.balance + audioBalance.staked + audioBalance.earned).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">AUDIO</p>
              </div>
            </div>

            {stakingPositions.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Active Stakes</h4>
                <div className="space-y-2">
                  {stakingPositions.map(stake => {
                    const endDate = new Date(stake.endDate);
                    const now = new Date();
                    const isMatured = now >= endDate;
                    const progress = Math.min(100, ((now.getTime() - new Date(stake.startDate).getTime()) / (endDate.getTime() - new Date(stake.startDate).getTime())) * 100);

                    return (
                      <div key={stake.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{stake.amount} AUDIO</span>
                            <Badge variant={isMatured ? 'default' : 'secondary'} className="ml-2">
                              {stake.apy}% APY
                            </Badge>
                          </div>
                          {isMatured && stake.status === 'active' && (
                            <Button size="sm" onClick={() => handleWithdraw(stake.id)}>
                              Withdraw
                            </Button>
                          )}
                        </div>
                        <Progress value={progress} className="mb-2" />
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {stake.duration} days
                          </div>
                          <span>
                            {isMatured ? 'Matured' : `${Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="convert" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Convert From</Label>
                <div className="flex gap-2">
                  <Button
                    variant={convertFrom === 'TON' ? 'default' : 'outline'}
                    onClick={() => setConvertFrom('TON')}
                    className="flex-1"
                  >
                    TON
                  </Button>
                  <Button
                    variant={convertFrom === 'AUDIO' ? 'default' : 'outline'}
                    onClick={() => setConvertFrom('AUDIO')}
                    className="flex-1"
                  >
                    AUDIO
                  </Button>
                </div>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {convertAmount && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span>{convertAmount} {convertFrom}</span>
                    <ArrowUpDown className="h-4 w-4" />
                    <span>
                      {convertFrom === 'TON' 
                        ? (Number(convertAmount) * conversionRate * 0.99).toFixed(4)
                        : (Number(convertAmount) / conversionRate * 0.99).toFixed(4)
                      } {convertFrom === 'TON' ? 'AUDIO' : 'TON'}
                    </span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Rate: 1 TON = {conversionRate.toFixed(4)} AUDIO (1% fee)
                  </p>
                </div>
              )}

              <Button onClick={handleConvert} disabled={loading || !convertAmount} className="w-full">
                {loading ? 'Converting...' : `Convert to ${convertFrom === 'TON' ? 'AUDIO' : 'TON'}`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stake" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Stake Amount (AUDIO)</Label>
                <Input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  max={audioBalance.balance}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {audioBalance.balance.toFixed(2)} AUDIO
                </p>
              </div>

              <div>
                <Label>Staking Duration</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 90, 180, 365].map(duration => (
                    <Button
                      key={duration}
                      variant={stakeDuration === duration ? 'default' : 'outline'}
                      onClick={() => setStakeDuration(duration)}
                      className="text-xs"
                    >
                      {duration}d
                      <br />
                      {getStakingAPY(duration)}% APY
                    </Button>
                  ))}
                </div>
              </div>

              {stakeAmount && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Staking Amount:</span>
                      <span>{stakeAmount} AUDIO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>APY:</span>
                      <span>{getStakingAPY(stakeDuration)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{stakeDuration} days</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Estimated Rewards:</span>
                      <span>
                        {((Number(stakeAmount) * getStakingAPY(stakeDuration) / 100 / 365) * stakeDuration).toFixed(4)} AUDIO
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleStake} disabled={loading || !stakeAmount} className="w-full">
                {loading ? 'Staking...' : 'Stake AUDIO Tokens'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};