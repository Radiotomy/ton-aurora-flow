import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';
import { CrossChainBridgeModal } from '@/components/CrossChainBridgeModal';
import { useTokenBalances } from '@/hooks/useTokenBalances';

export const CrossChainBridgeWidget: React.FC = () => {
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const { balances, refreshBalances, loading } = useTokenBalances();

  return (
    <>
      <Card className="gradient-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </div>
              Cross-Chain Bridge
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              TON ↔ AUDIO
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Seamlessly convert between TON and $AUDIO tokens
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">TON Balance</p>
              <p className="text-xl font-bold text-primary">
                {loading ? '...' : balances.find(b => b.token === 'TON')?.balance.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div className="space-y-1 text-center">
              <p className="text-sm text-muted-foreground">AUDIO Balance</p>
              <p className="text-xl font-bold text-primary">
                {loading ? '...' : balances.find(b => b.token === 'AUDIO')?.balance.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setIsBridgeOpen(true)}
            className="w-full gap-2"
            variant="glass"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Open Bridge
          </Button>

          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Rate</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-sm font-bold text-success">
                  1 TON = 2.34 AUDIO
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CrossChainBridgeModal 
        open={isBridgeOpen} 
        onOpenChange={setIsBridgeOpen}
        balances={balances}
        onConversionComplete={refreshBalances}
      />
    </>
  );
};