import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommunityChat } from '@/components/CommunityChat';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Heart, 
  Gift, 
  Volume2, 
  VolumeX,
  Maximize,
  MessageCircle,
  Settings,
  Share2,
  TrendingUp
} from 'lucide-react';

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

interface LiveStreamModalProps {
  event: LiveEvent;
  onClose: () => void;
}

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ 
  event, 
  onClose 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [likes, setLikes] = useState(1247);
  const [hasLiked, setHasLiked] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const { isConnected, sendTransaction } = useWeb3();
  const { toast } = useToast();

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
      toast({
        title: "❤️ Liked!",
        description: "Your reaction has been sent to the artist",
      });
    }
  };

  const handleTip = async () => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your TON wallet to send tips",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendTransaction(amount, event.artist_id, {
        showToast: false
      });

      toast({
        title: "🎉 Tip Sent!",
        description: `${amount} TON sent to ${event.artist_name}`,
      });

      setTipAmount('');
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Failed to send tip. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${event.artist_name} - Live on AudioTon`,
        text: `Watch ${event.title} live now!`,
        url: window.location.href
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Stream link copied to clipboard",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[80vh]">
      {/* Video Stream Area */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Player */}
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          {/* Simulated video stream */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-pink-900/50 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <p className="text-white/80">Live Stream Simulation</p>
                <p className="text-white/60 text-sm">Real streaming integration coming soon</p>
              </div>
            </div>
          </div>

          {/* Live Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              LIVE
            </Badge>
          </div>

          {/* Viewer Count */}
          <div className="absolute top-4 right-4 bg-black/50 rounded-lg px-3 py-1">
            <div className="flex items-center gap-1 text-white text-sm">
              <Users className="h-4 w-4" />
              {event.current_attendees.toLocaleString()}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsMuted(!isMuted)}
                className="bg-black/50 hover:bg-black/70"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleShare}
                className="bg-black/50 hover:bg-black/70"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Event Info */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <p className="text-aurora font-medium">{event.artist_name}</p>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending #2
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{event.description}</p>
            
            {/* Interaction Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-4">
                <Button
                  variant={hasLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className={hasLiked ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                  {likes.toLocaleString()}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>

              {/* Tip Section */}
              {isConnected && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="0.5"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-20 px-2 py-1 text-sm bg-background border border-border rounded"
                    step="0.1"
                    min="0"
                  />
                  <Button size="sm" onClick={handleTip} disabled={!tipAmount}>
                    <Gift className="h-4 w-4 mr-1" />
                    Tip TON
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Sidebar */}
      <div className={`space-y-4 ${showChat ? 'block' : 'hidden lg:block'}`}>
        <Card className="glass-card h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Live Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-full">
            <CommunityChat eventId={event.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};