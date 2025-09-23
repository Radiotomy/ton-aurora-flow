import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpDown, 
  Zap, 
  BarChart3,
  Settings,
  Eye,
  EyeOff
} from 'lucinde-react';
import { UnifiedWalletDisplay } from './UnifiedWalletDisplay';
import { RealTimeRateWidget } from './RealTimeRateWidget';
import { CrossTokenRewardsTracker } from './CrossTokenRewardsTracker';
import { CrossChainBridgeWidget } from './CrossChainBridgeWidget';
import { TokenConversionModal } from './TokenConversionModal';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useWeb3 } from '@/hooks/useWeb3';

interface EnhancedTokenDashboardProps {
  defaultTab?: 'overview' | 'rewards' | 'conversion' | 'analytics';
  compact?: boolean;
}

export const EnhancedTokenDashboard = ({
  defaultTab = 'overview',
  compact = false
}: EnhancedTokenDashboardProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [conversionPair, setConversionPair] = useState<{
    from: 'TON' | 'AUDIO';
    to: 'TON' | 'AUDIO';
  } | null>(null);

  const { balances, refreshBalances } = useTokenBalances();
  const { isConnected } = useWeb3();

  const handleQuickConvert = (fromToken: 'TON' | 'AUDIO', toToken: 'TON' | 'AUDIO') => {
    setConversionPair({ from: fromToken, to: toToken });
    setShowConversionModal(true);
  };

  const handleConversionComplete = () => {
    refreshBalances();
    setConversionPair(null);
  };

  if (!isConnected) {
    return (
      <Card className="border-dashed border-muted">
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-4">
            Connect your TON wallet to access dual-token features and enhanced rewards
          </p>
          <Button onClick={() => window.location.reload()}>
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UnifiedWalletDisplay className="col-span-1" />
        <RealTimeRateWidget compact onQuickConvert={handleQuickConvert} />
        <CrossChainBridgeWidget />
        
        <TokenConversionModal
          open={showConversionModal}
          onOpenChange={setShowConversionModal}
          balances={balances}
          onConversionComplete={handleConversionComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span>Enhanced Token Dashboard</span>
              <Badge variant="outline" className="ml-2">
                TON + $AUDIO
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
              >
                {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConversionModal(true)}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Exchange
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <UnifiedWalletDisplay />
            <RealTimeRateWidget onQuickConvert={handleQuickConvert} />
          </div>
          <CrossChainBridgeWidget />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <CrossTokenRewardsTracker />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <RealTimeRateWidget onQuickConvert={handleQuickConvert} />
            <CrossChainBridgeWidget />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Token Usage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p>Detailed token usage, conversion history, and ROI tracking coming soon.</p>
                <Button variant="outline" className="mt-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conversion Modal */}
      <TokenConversionModal
        open={showConversionModal}
        onOpenChange={setShowConversionModal}
        balances={balances}
        onConversionComplete={handleConversionComplete}
      />
    </div>
  );
};