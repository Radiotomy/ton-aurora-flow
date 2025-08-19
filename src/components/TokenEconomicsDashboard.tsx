import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWalletStore } from '@/stores/walletStore';
import { 
  Coins, 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  Gift,
  Music,
  Crown,
  Star,
  Heart
} from 'lucide-react';

interface TokenEconomicsDashboardProps {
  userStats: {
    tonBalance: number;
    reputationScore: number;
    totalEarned: number;
    totalSpent: number;
    nftsOwned: number;
    fanClubMemberships: number;
    listeningHours: number;
    artistsSupported: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    maxProgress: number;
    reward: number;
    unlocked: boolean;
    icon: string;
  }>;
  rewardOpportunities: Array<{
    id: string;
    title: string;
    description: string;
    reward: number;
    type: 'listening' | 'social' | 'collecting' | 'supporting';
    timeLeft?: string;
  }>;
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'listening': return Music;
    case 'social': return Star;
    case 'collecting': return Award;
    case 'supporting': return Gift;
    default: return Coins;
  }
};

const getRewardColor = (type: string) => {
  switch (type) {
    case 'listening': return 'bg-blue-500/20 text-blue-500';
    case 'social': return 'bg-purple-500/20 text-purple-500';
    case 'collecting': return 'bg-yellow-500/20 text-yellow-500';
    case 'supporting': return 'bg-green-500/20 text-green-500';
    default: return 'bg-primary/20 text-primary';
  }
};

export const TokenEconomicsDashboard: React.FC<TokenEconomicsDashboardProps> = ({
  userStats,
  achievements,
  rewardOpportunities
}) => {
  const reputationLevel = Math.floor(userStats.reputationScore / 1000) + 1;
  const nextLevelProgress = (userStats.reputationScore % 1000) / 10;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{userStats.tonBalance.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">TON Balance</div>
            </div>
          </div>
        </Card>
        
        <Card className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-aurora/20">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{userStats.reputationScore}</div>
              <div className="text-sm text-muted-foreground">Reputation</div>
            </div>
          </div>
        </Card>
        
        <Card className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{userStats.totalEarned.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">TON Earned</div>
            </div>
          </div>
        </Card>
        
        <Card className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Crown className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{userStats.nftsOwned}</div>
              <div className="text-sm text-muted-foreground">NFTs Owned</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Reputation Level */}
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-aurora">
              <Target className="h-6 w-6 text-background" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Reputation Level {reputationLevel}</h3>
              <p className="text-muted-foreground">
                {1000 - (userStats.reputationScore % 1000)} points to next level
              </p>
            </div>
          </div>
          <Badge className="bg-aurora text-lg px-3 py-1">
            Level {reputationLevel}
          </Badge>
        </div>
        <Progress value={nextLevelProgress} className="h-3" />
      </Card>

      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`glass-panel p-4 ${achievement.unlocked ? 'glass-panel-active' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${achievement.unlocked ? 'bg-aurora' : 'bg-muted'}`}>
                    <Award className={`h-6 w-6 ${achievement.unlocked ? 'text-background' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.title}</h4>
                      {achievement.unlocked && <Badge className="bg-aurora">Unlocked</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                        <div className="text-xs text-muted-foreground mt-1">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Coins className="h-4 w-4 text-primary" />
                        {achievement.reward} TON
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid gap-4">
            {rewardOpportunities.map((opportunity) => {
              const RewardIcon = getRewardIcon(opportunity.type);
              return (
                <Card key={opportunity.id} className="glass-panel p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${getRewardColor(opportunity.type)}`}>
                      <RewardIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{opportunity.title}</h4>
                        {opportunity.timeLeft && (
                          <Badge variant="outline">{opportunity.timeLeft} left</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {opportunity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-medium text-primary">
                          <Zap className="h-4 w-4" />
                          Earn {opportunity.reward} TON
                        </div>
                        <Button size="sm" variant="outline">
                          Start Quest
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-panel p-4 text-center">
              <Music className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.listeningHours}</div>
              <div className="text-sm text-muted-foreground">Hours Listened</div>
            </Card>
            
            <Card className="glass-panel p-4 text-center">
              <Heart className="h-8 w-8 text-destructive mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.artistsSupported}</div>
              <div className="text-sm text-muted-foreground">Artists Supported</div>
            </Card>
            
            <Card className="glass-panel p-4 text-center">
              <Crown className="h-8 w-8 text-aurora mx-auto mb-2" />
              <div className="text-2xl font-bold">{userStats.fanClubMemberships}</div>
              <div className="text-sm text-muted-foreground">Fan Clubs</div>
            </Card>
            
            <Card className="glass-panel p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {((userStats.totalEarned / userStats.totalSpent) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">ROI</div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};