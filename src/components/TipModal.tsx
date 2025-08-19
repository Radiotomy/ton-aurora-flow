import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { tonPaymentService } from '@/services/tonPaymentService';
import { Heart, Coins, Zap, Star, Gift } from 'lucide-react';

interface TipModalProps {
  open: boolean;
  onClose: () => void;
  artist: {
    id: string;
    name: string;
    avatar: string;
    walletAddress?: string;
  };
  track?: {
    id: string;
    title: string;
  };
}

const quickTipAmounts = [0.5, 1, 2, 5, 10, 25];

const getTipMessage = (amount: number) => {
  if (amount >= 25) return "🚀 Mega Supporter!";
  if (amount >= 10) return "⭐ Super Fan!";
  if (amount >= 5) return "💎 Amazing Support!";
  if (amount >= 2) return "🎵 Music Lover!";
  if (amount >= 1) return "❤️ Great Taste!";
  return "👏 Nice Support!";
};

export const TipModal: React.FC<TipModalProps> = ({ open, onClose, artist, track }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, connectWallet, walletAddress } = useWeb3();
  const { toast } = useToast();

  const tipAmount = selectedAmount || parseFloat(customAmount) || 0;

  const handleTip = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (tipAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount.",
        variant: "destructive",
      });
      return;
    }

    if (!artist.walletAddress) {
      toast({
        title: "Artist Wallet Not Found",
        description: "This artist hasn't set up their wallet yet.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Use the real TON payment service
      const result = await tonPaymentService.sendTip(walletAddress, {
        recipientAddress: artist.walletAddress,
        amount: tipAmount.toString(),
        message: message || `Tip for ${track?.title || 'your music'}`,
      });

      if (result.success) {
        toast({
          title: getTipMessage(tipAmount),
          description: `${tipAmount} TON sent to ${artist.name} successfully!`,
        });
        
        onClose();
        
        // Reset form
        setSelectedAmount(null);
        setCustomAmount('');
        setMessage('');
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Tip failed:', error);
      toast({
        title: "Tip Failed",
        description: error instanceof Error ? error.message : "Please try again or check your wallet connection.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Support Artist
          </DialogTitle>
        </DialogHeader>

        {/* Artist Info */}
        <Card className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <img 
              src={artist.avatar} 
              alt={artist.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{artist.name}</h3>
              {track && (
                <p className="text-sm text-muted-foreground">for "{track.title}"</p>
              )}
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              TON
            </Badge>
          </div>
        </Card>

        {/* Quick Tip Amounts */}
        <div className="space-y-3">
          <Label>Quick Amounts</Label>
          <div className="grid grid-cols-3 gap-2">
            {quickTipAmounts.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "aurora" : "outline"}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className="h-12 flex flex-col items-center justify-center"
              >
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  <span className="font-bold">{amount}</span>
                </div>
                <span className="text-xs opacity-70">TON</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="space-y-2">
          <Label htmlFor="custom-amount">Custom Amount (TON)</Label>
          <Input
            id="custom-amount"
            placeholder="Enter custom amount..."
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            type="number"
            step="0.1"
            min="0.1"
          />
        </div>

        {/* Personal Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Personal Message (Optional)</Label>
          <Input
            id="message"
            placeholder="Thanks for the amazing music! 🎵"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Tip Preview */}
        {tipAmount > 0 && (
          <Card className="glass-panel p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Your Tip</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-bold">{tipAmount} TON</span>
              </div>
            </div>
            {message && (
              <p className="text-sm text-muted-foreground mt-2 italic">"{message}"</p>
            )}
          </Card>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleTip} 
            disabled={isProcessing || tipAmount <= 0}
            className="flex-1"
            variant="aurora"
          >
            {isProcessing ? 'Sending...' : isConnected ? `Tip ${tipAmount || 0} TON` : 'Connect Wallet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};