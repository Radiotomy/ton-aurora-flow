import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LiveStreamModal } from '@/components/LiveStreamModal';
import { EventTicketing } from '@/components/EventTicketing';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  PlayCircle, 
  Clock,
  Star,
  MapPin,
  Ticket,
  Share2
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

interface LiveEventCardProps {
  event: LiveEvent;
  featured?: boolean;
}

export const LiveEventCard: React.FC<LiveEventCardProps> = ({ 
  event, 
  featured = false 
}) => {
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [isTicketingOpen, setIsTicketingOpen] = useState(false);
  const { isConnected } = useWeb3();
  const { toast } = useToast();

  const handleJoinEvent = () => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your TON wallet to join events",
        variant: "destructive"
      });
      return;
    }

    if (event.status === 'live') {
      setIsStreamOpen(true);
    } else if (event.status === 'upcoming') {
      setIsTicketingOpen(true);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Join ${event.artist_name} for "${event.title}"`,
        url: window.location.href + `?event=${event.id}`
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href + `?event=${event.id}`);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case 'live':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            LIVE
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="outline" className="border-aurora text-aurora">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary">
            Ended
          </Badge>
        );
    }
  };

  const attendancePercentage = event.max_attendees 
    ? (event.current_attendees / event.max_attendees) * 100 
    : 0;

  return (
    <Card className={`glass-card transition-all duration-300 hover:scale-105 ${
      featured ? 'border-aurora/50 bg-aurora/5' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {getStatusBadge()}
            <h3 className="font-semibold text-lg leading-tight">{event.title}</h3>
            <p className="text-sm text-aurora font-medium">{event.artist_name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Image/Thumbnail */}
        <div className="relative rounded-lg overflow-hidden bg-muted/50 aspect-video">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle className="h-12 w-12 text-white/80" />
          </div>
          {event.status === 'live' && (
            <div className="absolute top-3 left-3 z-20">
              <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                LIVE
              </Badge>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.scheduled_start), 'MMM d, HH:mm')}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {event.current_attendees}
              {event.max_attendees && `/${event.max_attendees}`}
            </div>
          </div>

          {/* Attendance Bar */}
          {event.max_attendees && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Attendance</span>
                <span>{Math.round(attendancePercentage)}% full</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-aurora rounded-full h-2 transition-all duration-300"
                  style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-aurora" />
              <span className="font-medium">{event.ticket_price_ton} TON</span>
            </div>
            {event.status === 'upcoming' && (
              <span className="text-xs text-muted-foreground">
                Per ticket
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {event.status === 'live' && (
            <Dialog open={isStreamOpen} onOpenChange={setIsStreamOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={handleJoinEvent}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Join Live
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <LiveStreamModal event={event} onClose={() => setIsStreamOpen(false)} />
              </DialogContent>
            </Dialog>
          )}

          {event.status === 'upcoming' && (
            <Dialog open={isTicketingOpen} onOpenChange={setIsTicketingOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1"
                  onClick={handleJoinEvent}
                  disabled={!isConnected}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  {isConnected ? 'Get Ticket' : 'Connect Wallet'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <EventTicketing event={event} onClose={() => setIsTicketingOpen(false)} />
              </DialogContent>
            </Dialog>
          )}

          {event.status === 'ended' && (
            <Button variant="outline" className="flex-1" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Event Ended
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Star className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};