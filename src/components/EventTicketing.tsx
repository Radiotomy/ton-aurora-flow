import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { 
  Ticket, 
  Star, 
  Crown, 
  Zap,
  Users,
  Calendar,
  Clock,
  Gift,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface LiveEvent {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string;
  description: string;
  scheduled_start: string;
  status: 'upcoming' | 'live' | 'ended';
  thumbnail_url?: string;
  ticket_price_ton: number;
  max_attendees?: number;
  current_attendees: number;
  created_at: string;
}

interface TicketTier {
  id: string;
  name: string;
  price_ton: number;
  description: string;
  perks: string[];
  available: number;
  total: number;
  color: string;
  icon: React.ComponentType<any>;
}

interface EventTicketingProps {
  event: LiveEvent;
  onClose: () => void;
}

export const EventTicketing: React.FC<EventTicketingProps> = ({ 
  event, 
  onClose 
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const { isConnected, sendTransaction } = useWeb3();
  const tonBalance = 100; // Mock balance for demo
  const { toast } = useToast();

  // Ticket tiers for the event
  const ticketTiers: TicketTier[] = [
    {
      id: 'general',
      name: 'General Access',
      price_ton: event.ticket_price_ton,
      description: 'Standard event access with live stream and chat',
      perks: [
        'Live stream access',
        'Community chat participation',
        'Basic emoji reactions',
        'Event replay access (48h)'
      ],
      available: 89,
      total: 150,
      color: 'text-blue-500',
      icon: Ticket
    },
    {
      id: 'vip',
      name: 'VIP Experience',
      price_ton: event.ticket_price_ton * 2.5,
      description: 'Enhanced experience with exclusive perks',
      perks: [
        'All General Access features',
        'Exclusive VIP chat room',
        'Priority Q&A submissions',
        'VIP badge in chat',
        'Extended replay access (7 days)',
        'Exclusive NFT collectible'
      ],
      available: 23,
      total: 50,
      color: 'text-purple-500',
      icon: Crown
    },
    {
      id: 'premium',
      name: 'Premium Plus',
      price_ton: event.ticket_price_ton * 5,
      description: 'Ultimate fan experience with artist interaction',
      perks: [
        'All VIP Experience features',
        'Pre-show artist meet & greet',
        'Personalized message from artist',
        'Limited edition signed NFT',
        'Exclusive premium emoji pack',
        'Lifetime event replays',
        'Early access to future events'
      ],
      available: 7,
      total: 20,
      color: 'text-yellow-500',
      icon: Sparkles
    }
  ];

  const selectedTierData = ticketTiers.find(tier => tier.id === selectedTier);
  const totalCost = selectedTierData ? selectedTierData.price_ton * quantity : 0;
  const hasEnoughBalance = tonBalance >= totalCost;

  useEffect(() => {
    // Auto-select general tier by default
    if (!selectedTier && ticketTiers.length > 0) {
      setSelectedTier(ticketTiers[0].id);
    }
  }, []);

  const handlePurchase = async () => {
    if (!isConnected || !selectedTierData) {
      toast({
        title: "Wallet Required",
        description: "Please connect your TON wallet to purchase tickets",
        variant: "destructive"
      });
      return;
    }

    if (!hasEnoughBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${totalCost} TON to purchase ${quantity} ticket(s)`,
        variant: "destructive"
      });
      return;
    }

    if (selectedTierData.available < quantity) {
      toast({
        title: "Not Enough Tickets",
        description: `Only ${selectedTierData.available} tickets available for this tier`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await sendTransaction(totalCost, event.artist_id, {
        showToast: false
      });

      setPurchaseSuccess(true);
      
      toast({
        title: "🎫 Tickets Purchased!",
        description: `${quantity} ${selectedTierData.name} ticket(s) for ${event.title}`,
      });

      // Update available tickets locally (in real app, this would be handled by backend)
      // This is just for demo purposes

    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase tickets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (purchaseSuccess) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
            <p className="text-muted-foreground">
              Your tickets have been minted as NFTs and added to your wallet
            </p>
          </div>

          <Card className="glass-card bg-aurora/5 border-aurora/30 mb-6">
            <CardContent className="p-4">
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Artist:</span>
                  <span className="font-medium text-aurora">{event.artist_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Type:</span>
                  <span className="font-medium">{selectedTierData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Paid:</span>
                  <span className="text-aurora">{totalCost} TON</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button className="w-full" onClick={onClose}>
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              View My Tickets
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <p className="text-aurora font-medium">{event.artist_name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.scheduled_start), 'PPP')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(event.scheduled_start), 'p')}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {event.current_attendees} attending
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-500">
              <Zap className="h-3 w-3 mr-1" />
              Live Event
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Ticket Tiers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose Your Experience</h3>
        
        {ticketTiers.map(tier => (
          <Card 
            key={tier.id}
            className={`glass-card cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedTier === tier.id 
                ? 'border-aurora bg-aurora/5' 
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => setSelectedTier(tier.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-current/20 ${tier.color}`}>
                    <tier.icon className={`h-5 w-5 ${tier.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{tier.name}</h4>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{tier.price_ton} TON</div>
                  <div className="text-xs text-muted-foreground">
                    {tier.available}/{tier.total} available
                  </div>
                </div>
              </div>

              {/* Perks List */}
              <div className="space-y-1">
                {tier.perks.map((perk, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Availability Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Availability</span>
                  <span>{Math.round((tier.available / tier.total) * 100)}% remaining</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      tier.available > tier.total * 0.5 ? 'bg-green-500' :
                      tier.available > tier.total * 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(tier.available / tier.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quantity & Purchase */}
      {selectedTierData && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-4">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setQuantity(Math.min(selectedTierData.available, quantity + 1))}
                  disabled={quantity >= selectedTierData.available}
                >
                  +
                </Button>
              </div>
            </div>

            <Separator />

            {/* Cost Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>{quantity}x {selectedTierData.name}</span>
                <span>{selectedTierData.price_ton * quantity} TON</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-aurora">{totalCost} TON</span>
              </div>
              
              {isConnected && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Your Balance:</span>
                  <span className={hasEnoughBalance ? "text-green-500" : "text-red-500"}>
                    {tonBalance} TON
                  </span>
                </div>
              )}
            </div>

            {/* Purchase Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePurchase}
              disabled={!isConnected || loading || !hasEnoughBalance || selectedTierData.available < quantity}
            >
              {loading ? (
                "Processing..."
              ) : !isConnected ? (
                "Connect Wallet to Purchase"
              ) : !hasEnoughBalance ? (
                "Insufficient Balance"
              ) : selectedTierData.available < quantity ? (
                "Not Enough Tickets Available"
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Purchase {quantity} Ticket{quantity > 1 ? 's' : ''} for {totalCost} TON
                </>
              )}
            </Button>

            {!hasEnoughBalance && isConnected && (
              <p className="text-xs text-red-500 text-center">
                You need {(totalCost - tonBalance).toFixed(2)} more TON to complete this purchase
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};