import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import LiveStreamService, { type LiveEvent } from '@/services/liveStreamService';
import { supabase } from '@/integrations/supabase/client';

export interface UseStreamOptions {
  eventId?: string;
  isStreamer?: boolean;
}

export const useLiveStream = ({ eventId, isStreamer = false }: UseStreamOptions = {}) => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamSessions, setStreamSessions] = useState([]);
  
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  // Load events
  const loadEvents = async (status?: 'upcoming' | 'live' | 'ended') => {
    try {
      setLoading(true);
      const events = await LiveStreamService.getEvents(status);
      setEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load specific event
  const loadEvent = async (id: string) => {
    try {
      const event = await LiveStreamService.getEventById(id);
      setCurrentEvent(event);
      return event;
    } catch (error) {
      console.error('Error loading event:', error);
      return null;
    }
  };

  // Create new event
  const createEvent = async (eventData: Partial<LiveEvent>) => {
    try {
      const event = await LiveStreamService.createEvent(eventData);
      toast({
        title: "Event Created",
        description: "Live event created successfully!"
      });
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Start streaming (for streamers)
  const startStream = async (eventId: string) => {
    if (!isStreamer || !isAuthenticated) return false;

    try {
      // Request media access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true 
        }
      });

      streamRef.current = stream;

      // Update event status to live
      await LiveStreamService.updateEventStatus(eventId, 'live');
      
      // Create stream session
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (profile) {
        await LiveStreamService.createStreamSession(
          eventId, 
          profile.id, 
          `session_${Date.now()}`,
          `peer_${Date.now()}`
        );
      }

      setStreaming(true);
      
      toast({
        title: "Stream Started",
        description: "You are now live streaming!"
      });

      return true;
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Stream Error",
        description: "Failed to start streaming. Check your permissions.",
        variant: "destructive"
      });
      return false;
    }
  };

  // End streaming
  const endStream = async (eventId: string) => {
    try {
      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Update event status
      await LiveStreamService.updateEventStatus(eventId, 'ended');
      
      setStreaming(false);
      
      toast({
        title: "Stream Ended",
        description: "Live stream has been ended."
      });
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  // Purchase ticket
  const purchaseTicket = async (eventId: string, tier: 'general' | 'vip' | 'premium' = 'general') => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase tickets",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get ticket price based on tier and event
      const event = await LiveStreamService.getEventById(eventId);
      const basePrice = event.ticket_price_ton || 0;
      const tierMultiplier = { general: 1, vip: 2, premium: 3 };
      const price = basePrice * tierMultiplier[tier];

      const ticket = await LiveStreamService.purchaseTicket(eventId, profile.id, tier, price);
      
      toast({
        title: "Ticket Purchased!",
        description: `Successfully purchased ${tier} ticket for ${price} TON`
      });

      return ticket;
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase ticket. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Check if user has ticket
  const hasTicket = async (eventId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return false;
      
      return await LiveStreamService.hasTicket(eventId, profile.id);
    } catch (error) {
      console.error('Error checking ticket:', error);
      return false;
    }
  };

  // Get user tickets
  const getUserTickets = async () => {
    if (!isAuthenticated || !user) return [];

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return [];
      
      return await LiveStreamService.getUserTickets(profile.id);
    } catch (error) {
      console.error('Error loading tickets:', error);
      return [];
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!eventId) return;

    const eventChannel = LiveStreamService.subscribeToEventUpdates(eventId, (event) => {
      setCurrentEvent(event);
    });

    const sessionChannel = LiveStreamService.subscribeToStreamSessions(eventId, (sessions) => {
      setStreamSessions(sessions);
      setViewerCount(sessions.length);
    });

    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [eventId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return {
    // State
    events,
    currentEvent,
    loading,
    streaming,
    viewerCount,
    streamSessions,
    
    // Actions
    loadEvents,
    loadEvent,
    createEvent,
    startStream,
    endStream,
    purchaseTicket,
    hasTicket,
    getUserTickets,
    
    // Refs (for advanced usage)
    streamRef: streamRef.current,
    peerConnectionRef: peerConnectionRef.current
  };
};

export default useLiveStream;