import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ArrowUpDown, Wallet, TrendingUp } from 'lucide-react';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { TokenConversionModal } from './TokenConversionModal';
import { cn } from '@/lib/utils';

interface UnifiedWalletDisplayProps {
  className?: string;
}

export const UnifiedWalletDisplay = ({ className }: UnifiedWalletDisplayProps) => {
  const { balances, loading, error, refreshBalances, getBalance, totalValueInTon } = useTokenBalances();
  const [conversionModalOpen, setConversionModalOpen] = useState(false);

  const tonBalance = getBalance('TON');
  const audioBalance = getBalance('AUDIO');

  const formatBalance = (balance: number, decimals: number = 2): string => {
    return balance.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals 
    });
  };

  if (error) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <Wallet className="h-4 w-4" />
            <span>Error loading wallet: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("bg-gradient-to-br from-primary/5 to-accent/5", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Multi-Token Wallet
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalances}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Total Value Display */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatBalance(totalValueInTon, 4)} TON
            </div>
          </div>

          <Separator />

          {/* Individual Token Balances */}
          <div className="space-y-3">
            {/* TON Balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">TON</span>
                </div>
                <div>
                  <div className="font-medium">TON Coin</div>
                  <div className="text-sm text-muted-foreground">The Open Network</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {loading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    formatBalance(tonBalance, 4)
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Native
                </Badge>
              </div>
            </div>

            {/* $AUDIO Balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent-foreground">♫</span>
                </div>
                <div>
                  <div className="font-medium">$AUDIO</div>
                  <div className="text-sm text-muted-foreground">Audius Protocol</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {loading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    formatBalance(audioBalance, 2)
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  Cross-chain
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setConversionModalOpen(true)}
              disabled={loading || (tonBalance === 0 && audioBalance === 0)}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Convert
            </Button>
          </div>

          {/* Quick Stats */}
          {!loading && (tonBalance > 0 || audioBalance > 0) && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              Assets distributed across {balances.filter(b => b.balance > 0).length} token{balances.filter(b => b.balance > 0).length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      <TokenConversionModal
        open={conversionModalOpen}
        onOpenChange={setConversionModalOpen}
        balances={balances}
        onConversionComplete={refreshBalances}
      />
    </>
  );
};