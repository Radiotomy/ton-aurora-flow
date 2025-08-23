import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Zap, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenType, PaymentContext, UnifiedPaymentService } from '@/services/unifiedPaymentService';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useWeb3 } from '@/hooks/useWeb3';

interface PaymentOption {
  token: TokenType;
  amount: number;
  available: boolean;
  optimal: boolean;
  conversionNeeded: boolean;
  conversionRate?: number;
  estimatedFees?: number;
}

interface SmartPaymentSelectorProps {
  context: PaymentContext;
  onPaymentSelect: (token: TokenType, amount: number) => void;
  onConversionNeeded: (fromToken: TokenType, toToken: TokenType, amount: number) => void;
  className?: string;
  disabled?: boolean;
}

export const SmartPaymentSelector = ({
  context,
  onPaymentSelect,
  onConversionNeeded,
  className,
  disabled = false
}: SmartPaymentSelectorProps) => {
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedToken, setRecommendedToken] = useState<TokenType | null>(null);
  
  const { balances, getBalance } = useTokenBalances();
  const { profile } = useWeb3();

  useEffect(() => {
    if (!profile?.id || balances.length === 0) return;

    const calculatePaymentOptions = async () => {
      setLoading(true);
      
      try {
        // Get optimal token recommendation
        const optimal = await UnifiedPaymentService.detectOptimalToken(context, balances);
        setRecommendedToken(optimal);

        // Get conversion rates
        const tonToAudioRate = await UnifiedPaymentService.getConversionRate('TON', 'AUDIO');
        const audioToTonRate = await UnifiedPaymentService.getConversionRate('AUDIO', 'TON');

        // Calculate payment options
        const tonBalance = getBalance('TON');
        const audioBalance = getBalance('AUDIO');

        const options: PaymentOption[] = [
          // Direct TON payment
          {
            token: 'TON',
            amount: context.amount,
            available: tonBalance >= context.amount,
            optimal: optimal === 'TON',
            conversionNeeded: false
          },
          // Direct $AUDIO payment
          {
            token: 'AUDIO',
            amount: context.amount,
            available: audioBalance >= context.amount,
            optimal: optimal === 'AUDIO',
            conversionNeeded: false
          },
          // Convert TON to $AUDIO if needed
          ...(tonBalance > 0 && audioBalance < context.amount && tonToAudioRate > 0 ? [{
            token: 'AUDIO' as TokenType,
            amount: context.amount,
            available: tonBalance >= (context.amount / tonToAudioRate),
            optimal: false,
            conversionNeeded: true,
            conversionRate: tonToAudioRate,
            estimatedFees: (context.amount / tonToAudioRate) * 0.005
          }] : []),
          // Convert $AUDIO to TON if needed
          ...(audioBalance > 0 && tonBalance < context.amount && audioToTonRate > 0 ? [{
            token: 'TON' as TokenType,
            amount: context.amount,
            available: audioBalance >= (context.amount / audioToTonRate),
            optimal: false,
            conversionNeeded: true,
            conversionRate: audioToTonRate,
            estimatedFees: (context.amount / audioToTonRate) * 0.005
          }] : [])
        ];

        // Remove duplicates and sort by preference
        const uniqueOptions = options.filter((option, index, arr) => 
          arr.findIndex(o => o.token === option.token && o.conversionNeeded === option.conversionNeeded) === index
        );

        setPaymentOptions(uniqueOptions.sort((a, b) => {
          if (a.optimal && !b.optimal) return -1;
          if (!a.optimal && b.optimal) return 1;
          if (a.available && !b.available) return -1;
          if (!a.available && b.available) return 1;
          if (!a.conversionNeeded && b.conversionNeeded) return -1;
          if (a.conversionNeeded && !b.conversionNeeded) return 1;
          return 0;
        }));

      } catch (error) {
        console.error('Error calculating payment options:', error);
      } finally {
        setLoading(false);
      }
    };

    calculatePaymentOptions();
  }, [context, balances, profile?.id, getBalance]);

  const handleOptionSelect = (option: PaymentOption) => {
    if (option.conversionNeeded) {
      const fromToken = option.token === 'TON' ? 'AUDIO' : 'TON';
      onConversionNeeded(fromToken, option.token, option.amount);
    } else {
      onPaymentSelect(option.token, option.amount);
    }
  };

  const getTokenIcon = (token: TokenType) => {
    return token === 'TON' ? '💎' : '♫';
  };

  const getContextTitle = () => {
    switch (context.contentType) {
      case 'audius_track': return 'Track Purchase';
      case 'audioton_nft': return 'NFT Purchase';
      case 'fan_club': return 'Fan Club Membership';
      case 'tip': return 'Tip Artist';
      default: return 'Payment';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{getContextTitle()}</h3>
          <div className="text-sm text-muted-foreground">
            Amount: {context.amount} {context.currency || 'tokens'}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Payment Options</div>
          
          {paymentOptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">Insufficient balance for this payment</div>
              <div className="text-xs mt-1">Add funds to continue</div>
            </div>
          ) : (
            paymentOptions.map((option, index) => (
              <Button
                key={`${option.token}-${option.conversionNeeded}-${index}`}
                variant={option.optimal ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-auto p-3",
                  !option.available && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled || !option.available}
                onClick={() => handleOptionSelect(option)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTokenIcon(option.token)}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.token}</span>
                        {option.optimal && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {option.conversionNeeded && (
                          <Badge variant="outline" className="text-xs">
                            <ArrowUpDown className="h-3 w-3 mr-1" />
                            Convert
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {option.conversionNeeded ? (
                          <>Auto-convert from {option.token === 'TON' ? 'AUDIO' : 'TON'}</>
                        ) : (
                          `Pay directly with ${option.token}`
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {option.available ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>

        {recommendedToken && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Smart suggestion: {recommendedToken} is optimal for {context.contentType.replace('_', ' ')} based on your preferences and balances.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};