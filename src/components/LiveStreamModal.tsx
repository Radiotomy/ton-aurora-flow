import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LiveStreamInterface } from '@/components/LiveStreamInterface';
import LiveStreamService from '@/services/liveStreamService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

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
  requires_ticket?: boolean;
}

interface LiveStreamModalProps {
  event: LiveEvent;
  onClose: () => void;
}

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ 
  event, 
  onClose 
}) => {
  const [hasTicket, setHasTicket] = useState(false);
  const [isStreamer, setIsStreamer] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, [event.id, isAuthenticated, user]);

  const checkAccess = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Check if user is the artist (streamer)
      const isEventCreator = profile.display_name === event.artist_name;
      setIsStreamer(isEventCreator);

      // Check if user has a ticket (for ticketed events)
      if (event.requires_ticket && !isEventCreator) {
        const ticketExists = await LiveStreamService.hasTicket(event.id, profile.id);
        setHasTicket(ticketExists);
      } else {
        setHasTicket(true); // Free events or streamer access
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasTicket(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamEnd = () => {
    toast({
      title: "Stream Ended",
      description: "The live stream has been ended."
    });
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aurora mx-auto" />
            <p>Loading stream...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hasTicket && !isStreamer && isAuthenticated) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 p-6">
            <h3 className="text-lg font-semibold">Ticket Required</h3>
            <p className="text-muted-foreground">
              This is a ticketed event. Please purchase a ticket to access the live stream.
            </p>
            <Button onClick={onClose}>
              Back to Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-6">
        <LiveStreamInterface 
          eventId={event.id}
          isStreamer={isStreamer}
          onStreamEnd={handleStreamEnd}
        />
      </DialogContent>
    </Dialog>
  );
};