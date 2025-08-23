import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, TrendingUp, AlertCircle } from 'lucide-react';
import { TokenType, TokenBalance, UnifiedPaymentService } from '@/services/unifiedPaymentService';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TokenConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: TokenBalance[];
  onConversionComplete: () => void;
}

export const TokenConversionModal = ({
  open,
  onOpenChange,
  balances,
  onConversionComplete
}: TokenConversionModalProps) => {
  const [fromToken, setFromToken] = useState<TokenType>('TON');
  const [toToken, setToToken] = useState<TokenType>('AUDIO');
  const [amount, setAmount] = useState('');
  const [conversionRate, setConversionRate] = useState(0);
  const [estimatedReceived, setEstimatedReceived] = useState(0);
  const [fees, setFees] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);

  const { profile } = useWeb3();
  const { toast } = useToast();

  const getBalance = (token: TokenType) => {
    return balances.find(b => b.token === token)?.balance || 0;
  };

  // Fetch conversion rate when tokens change
  useEffect(() => {
    if (fromToken === toToken) return;

    const fetchRate = async () => {
      setRateLoading(true);
      try {
        const rate = await UnifiedPaymentService.getConversionRate(fromToken, toToken);
        setConversionRate(rate);
      } catch (error) {
        console.error('Error fetching conversion rate:', error);
        setConversionRate(0);
      } finally {
        setRateLoading(false);
      }
    };

    fetchRate();
  }, [fromToken, toToken]);

  // Calculate estimated received amount and fees
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount > 0 && conversionRate > 0) {
      const calculatedFees = numAmount * 0.005; // 0.5% fee
      const received = (numAmount - calculatedFees) * conversionRate;
      setFees(calculatedFees);
      setEstimatedReceived(received);
    } else {
      setFees(0);
      setEstimatedReceived(0);
    }
  }, [amount, conversionRate]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  const handleMaxAmount = () => {
    const maxBalance = getBalance(fromToken);
    setAmount(maxBalance.toString());
  };

  const handleConvert = async () => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to convert tokens",
        variant: "destructive"
      });
      return;
    }

    const numAmount = parseFloat(amount);
    const balance = getBalance(fromToken);

    if (numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive"
      });
      return;
    }

    if (numAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken} tokens`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await UnifiedPaymentService.convertTokens(
        profile.id,
        numAmount,
        fromToken,
        toToken
      );

      if (result.success) {
        toast({
          title: "Conversion Successful",
          description: `Converted ${numAmount} ${fromToken} to ${result.toAmount.toFixed(4)} ${toToken}`,
        });
        onConversionComplete();
        onOpenChange(false);
        setAmount('');
      } else {
        toast({
          title: "Conversion Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: "Failed to process conversion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const fromBalance = getBalance(fromToken);
  const isValidAmount = numAmount > 0 && numAmount <= fromBalance;
  const canConvert = isValidAmount && conversionRate > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Token Conversion
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Token */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
              <Button
                variant={fromToken === 'TON' ? "default" : "outline"}
                size="sm"
                onClick={() => setFromToken('TON')}
                className="flex-1"
              >
                💎 TON
              </Button>
              <Button
                variant={fromToken === 'AUDIO' ? "default" : "outline"}
                size="sm"
                onClick={() => setFromToken('AUDIO')}
                className="flex-1"
              >
                ♫ $AUDIO
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Available: {fromBalance.toFixed(4)} {fromToken}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxAmount}
                className="h-auto p-0 text-xs"
              >
                MAX
              </Button>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                numAmount > fromBalance && "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapTokens}
              className="rounded-full p-2"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex gap-2">
              <Button
                variant={toToken === 'TON' ? "default" : "outline"}
                size="sm"
                onClick={() => setToToken('TON')}
                className="flex-1"
              >
                💎 TON
              </Button>
              <Button
                variant={toToken === 'AUDIO' ? "default" : "outline"}
                size="sm"
                onClick={() => setToToken('AUDIO')}
                className="flex-1"
              >
                ♫ $AUDIO
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-semibold">
                {rateLoading ? (
                  <div className="h-6 w-24 bg-muted-foreground/20 animate-pulse rounded" />
                ) : (
                  `≈ ${estimatedReceived.toFixed(4)} ${toToken}`
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Conversion Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Exchange Rate
              </span>
              <span>
                {rateLoading ? (
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  `1 ${fromToken} = ${conversionRate.toFixed(4)} ${toToken}`
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Conversion Fee (0.5%)</span>
              <span>{fees.toFixed(4)} {fromToken}</span>
            </div>
          </div>

          {/* Warnings */}
          {numAmount > fromBalance && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Insufficient {fromToken} balance</span>
            </div>
          )}

          {conversionRate === 0 && !rateLoading && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Conversion rate unavailable</span>
            </div>
          )}

          {/* Convert Button */}
          <Button
            onClick={handleConvert}
            disabled={!canConvert || loading}
            className="w-full"
          >
            {loading ? "Converting..." : "Convert Tokens"}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Conversions are processed instantly. Network fees may apply.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};