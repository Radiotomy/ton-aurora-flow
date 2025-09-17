import { supabase } from '@/integrations/supabase/client';

export interface LiveEvent {
  id: string;
  title: string;
  artist_name: string; // Display name for frontend
  artist_id: string;   // Database field
  description?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: 'upcoming' | 'live' | 'ended';
  stream_url?: string;
  thumbnail_url?: string;
  ticket_price_ton?: number;
  max_attendees?: number;
  current_attendees: number;
  requires_ticket?: boolean;
}

export interface EventTicket {
  id: string;
  event_id: string;
  profile_id: string;
  tier: 'general' | 'vip' | 'premium';
  ticket_nft_address?: string;
  purchase_price_ton: number;
  purchased_at: string;
  is_valid: boolean;
}

export class LiveStreamService {
  
  static async createEvent(eventData: Partial<LiveEvent>) {
    // Transform frontend format to database format
    const dbEventData = {
      title: eventData.title || '',
      artist_name: eventData.artist_name || '',
      artist_id: eventData.artist_id || '',
      description: eventData.description,
      scheduled_start: eventData.scheduled_start || new Date().toISOString(),
      scheduled_end: eventData.scheduled_end,
      status: eventData.status || 'upcoming',
      stream_url: eventData.stream_url,
      thumbnail_url: eventData.thumbnail_url,
      ticket_price_ton: eventData.ticket_price_ton || 0,
      max_attendees: eventData.max_attendees,
      current_attendees: eventData.current_attendees || 0,
      requires_ticket: eventData.requires_ticket || false
    };

    const { data, error } = await supabase
      .from('live_events')
      .insert(dbEventData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async updateEventStatus(eventId: string, status: 'upcoming' | 'live' | 'ended') {
    const { data, error } = await supabase
      .from('live_events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async getEvents(status?: 'upcoming' | 'live' | 'ended') {
    let query = supabase
      .from('live_events')
      .select('*')
      .order('scheduled_start', { ascending: true });
      
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Transform database format to frontend format  
    return (data || []).map(event => ({
      id: event.id,
      title: event.title,
      artist_name: event.artist_name || event.artist_id || 'Unknown Artist',
      artist_id: event.artist_id,
      description: event.description,
      scheduled_start: event.scheduled_start,
      scheduled_end: event.scheduled_end,
      status: event.status as 'upcoming' | 'live' | 'ended',
      stream_url: event.stream_url,
      thumbnail_url: event.thumbnail_url,
      ticket_price_ton: event.ticket_price_ton,
      max_attendees: event.max_attendees,
      current_attendees: event.current_attendees || 0,
      requires_ticket: event.requires_ticket
    }));
  }

  static async getEventById(eventId: string): Promise<LiveEvent> {
    const { data, error } = await supabase
      .from('live_events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (error) throw error;
    
    // Transform database format to frontend format
    return {
      id: data.id,
      title: data.title,
      artist_name: data.artist_name || data.artist_id || 'Unknown Artist',
      artist_id: data.artist_id,
      description: data.description,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      status: data.status as 'upcoming' | 'live' | 'ended',
      stream_url: data.stream_url,
      thumbnail_url: data.thumbnail_url,
      ticket_price_ton: data.ticket_price_ton,
      max_attendees: data.max_attendees,
      current_attendees: data.current_attendees || 0,
      requires_ticket: data.requires_ticket
    };
  }

  static async purchaseTicket(eventId: string, profileId: string, tier: 'general' | 'vip' | 'premium', priceInTon: number) {
    const { data, error } = await supabase
      .from('event_tickets')
      .insert({
        event_id: eventId,
        profile_id: profileId,
        tier,
        purchase_price_ton: priceInTon,
        is_valid: true
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Update attendee count
    await this.incrementAttendeeCount(eventId);
    
    return data;
  }

  static async getUserTickets(profileId: string) {
    const { data, error } = await supabase
      .from('event_tickets')
      .select(`
        *,
        live_events (
          id,
          title,
          artist_name,
          scheduled_start,
          status
        )
      `)
      .eq('profile_id', profileId)
      .eq('is_valid', true);
      
    if (error) throw error;
    return data || [];
  }

  static async hasTicket(eventId: string, profileId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('profile_id', profileId)
      .eq('is_valid', true)
      .single();
      
    return !!data && !error;
  }

  static async createStreamSession(eventId: string, profileId: string, sessionToken: string, peerId?: string) {
    const { data, error } = await supabase
      .from('stream_sessions')
      .insert({
        event_id: eventId,
        profile_id: profileId,
        session_token: sessionToken,
        peer_id: peerId,
        is_active: true
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async endStreamSession(sessionId: string) {
    const { data, error } = await supabase
      .from('stream_sessions')
      .update({
        left_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', sessionId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async getActiveStreamSessions(eventId: string) {
    const { data, error } = await supabase
      .from('stream_sessions')
      .select(`
        *,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .eq('is_active', true);
      
    if (error) throw error;
    return data || [];
  }

  static async incrementAttendeeCount(eventId: string) {
    // Get current count
    const { data: event } = await supabase
      .from('live_events')
      .select('current_attendees')
      .eq('id', eventId)
      .single();
      
    if (event) {
      const newCount = (event.current_attendees || 0) + 1;
      await supabase
        .from('live_events')
        .update({ current_attendees: newCount })
        .eq('id', eventId);
    }
  }

  static async decrementAttendeeCount(eventId: string) {
    // Get current count
    const { data: event } = await supabase
      .from('live_events')
      .select('current_attendees')
      .eq('id', eventId)
      .single();
      
    if (event && (event.current_attendees || 0) > 0) {
      const newCount = event.current_attendees - 1;
      await supabase
        .from('live_events')
        .update({ current_attendees: newCount })
        .eq('id', eventId);
    }
  }

  // Real-time subscriptions
  static subscribeToEventUpdates(eventId: string, callback: (event: LiveEvent) => void) {
    return supabase
      .channel(`event-${eventId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_events', filter: `id=eq.${eventId}` },
        (payload) => callback(payload.new as LiveEvent)
      )
      .subscribe();
  }

  static subscribeToStreamSessions(eventId: string, callback: (sessions: any[]) => void) {
    return supabase
      .channel(`stream-sessions-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stream_sessions', filter: `event_id=eq.${eventId}` },
        () => {
          // Reload sessions when changes occur
          this.getActiveStreamSessions(eventId).then(callback);
        }
      )
      .subscribe();
  }
}

export default LiveStreamService;