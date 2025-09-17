import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useWeb3 } from '@/hooks/useWeb3';
import { CrossChainBridge, ConversionQuote } from '@/services/crossChainBridge';
import { ArrowLeftRight, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CrossChainBridgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances?: { token: 'TON' | 'AUDIO'; balance: number }[];
  onConversionComplete: () => void;
}

export const CrossChainBridgeModal: React.FC<CrossChainBridgeModalProps> = ({
  open,
  onOpenChange,
  balances = [],
  onConversionComplete
}) => {
  const { toast } = useToast();
  const { profile } = useWeb3();
  
  const [fromToken, setFromToken] = useState<'TON' | 'AUDIO'>('TON');
  const [toToken, setToToken] = useState<'TON' | 'AUDIO'>('AUDIO');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<ConversionQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const fromBalance = balances.find(b => b.token === fromToken)?.balance || 0;
  const toBalance = balances.find(b => b.token === toToken)?.balance || 0;

  // Get quote when amount or tokens change
  useEffect(() => {
    const getQuote = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setQuote(null);
        return;
      }

      try {
        setQuoteLoading(true);
        const newQuote = await CrossChainBridge.getConversionQuote(
          fromToken,
          toToken,
          parseFloat(amount)
        );
        setQuote(newQuote);
      } catch (error) {
        console.error('Error getting quote:', error);
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(getQuote, 300);
    return () => clearTimeout(debounce);
  }, [amount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleMaxAmount = () => {
    setAmount(fromBalance.toString());
  };

  const handleConvert = async () => {
    if (!profile || !quote || !amount) return;

    if (parseFloat(amount) > fromBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setConverting(true);

      const result = await CrossChainBridge.initiateConversion(
        profile.id,
        fromToken,
        toToken,
        parseFloat(amount)
      );

      toast({
        title: "Conversion Successful!",
        description: `Converted ${amount} ${fromToken} to ${result.toAmount.toFixed(4)} ${toToken}`,
      });

      // Reset form
      setAmount('');
      setQuote(null);
      
      // Notify parent to refresh balances
      onConversionComplete();
      
      // Close modal
      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= fromBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Cross-Chain Token Bridge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Section */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
              <Select value={fromToken} onValueChange={(value: 'TON' | 'AUDIO') => setFromToken(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TON">TON</SelectItem>
                  <SelectItem value="AUDIO">AUDIO</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1 relative">
                <Input
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.001"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                  onClick={handleMaxAmount}
                >
                  MAX
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Available: {fromBalance.toFixed(4)} {fromToken}</span>
              {parseFloat(amount) > fromBalance && (
                <span className="text-destructive">Insufficient balance</span>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapTokens}
              className="rounded-full w-10 h-10 p-0"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex gap-2">
              <Select value={toToken} onValueChange={(value: 'TON' | 'AUDIO') => setToToken(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TON">TON</SelectItem>
                  <SelectItem value="AUDIO">AUDIO</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                value={quote ? quote.toAmount.toFixed(4) : '0.00'}
                readOnly
                className="flex-1 bg-muted"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Balance: {toBalance.toFixed(4)} {toToken}
            </div>
          </div>

          {/* Quote Details */}
          {quoteLoading && (
            <Card className="border-dashed">
              <CardContent className="p-4 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Getting quote...</span>
              </CardContent>
            </Card>
          )}

          {quote && !quoteLoading && (
            <Card className="glass-panel border-glass">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span>1 {fromToken} = {quote.rate.toFixed(4)} {toToken}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bridge Fee (0.5%)</span>
                  <span>{quote.fees.toFixed(4)} {fromToken}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You'll Receive</span>
                  <span className="font-medium">{quote.toAmount.toFixed(4)} {toToken}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Estimated time: ~{quote.estimatedTime}s</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span>Quote valid until: {quote.validUntil.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Messages */}
          {!isValidAmount && amount && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Invalid amount or insufficient balance
                </span>
              </CardContent>
            </Card>
          )}

          {!quote && !quoteLoading && amount && parseFloat(amount) > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Unable to get conversion rate. Please try again.
                </span>
              </CardContent>
            </Card>
          )}

          {/* Convert Button */}
          <Button
            onClick={handleConvert}
            disabled={!profile || !isValidAmount || !quote || converting || quoteLoading}
            className="w-full gap-2"
            size="lg"
          >
            {converting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <ArrowLeftRight className="h-4 w-4" />
                Convert Tokens
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};