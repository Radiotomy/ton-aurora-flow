-- Create live events system tables

-- Live events table
CREATE TABLE public.live_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
  thumbnail_url TEXT,
  stream_url TEXT,
  ticket_price_ton DECIMAL(10,2) DEFAULT 0,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  requires_ticket BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event tickets table
CREATE TABLE public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'general' CHECK (tier IN ('general', 'vip', 'premium')),
  ticket_nft_address TEXT,
  purchase_price_ton DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_valid BOOLEAN DEFAULT true,
  UNIQUE(event_id, profile_id)
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.live_events(id) ON DELETE CASCADE,
  artist_id TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'tip', 'join', 'reaction')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community polls table
CREATE TABLE public.community_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL, -- Array of {text: string, votes: number}
  total_votes INTEGER DEFAULT 0,
  poll_type TEXT NOT NULL DEFAULT 'general' CHECK (poll_type IN ('general', 'artist', 'event', 'feature')),
  requires_wallet BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, profile_id)
);

-- Live stream sessions table for WebRTC management
CREATE TABLE public.stream_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  peer_id TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_events (public read, authenticated create/update)
CREATE POLICY "Live events are viewable by everyone" 
ON public.live_events 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create events" 
ON public.live_events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Event creators can update their events" 
ON public.live_events 
FOR UPDATE 
TO authenticated 
USING (artist_id = (SELECT display_name FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for event_tickets
CREATE POLICY "Users can view their own tickets" 
ON public.event_tickets 
FOR SELECT 
TO authenticated 
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can purchase tickets" 
ON public.event_tickets 
FOR INSERT 
TO authenticated 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for chat_messages
CREATE POLICY "Chat messages are viewable by everyone" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.chat_messages 
FOR INSERT 
TO authenticated 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for community_polls
CREATE POLICY "Polls are viewable by everyone" 
ON public.community_polls 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create polls" 
ON public.community_polls 
FOR INSERT 
TO authenticated 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for poll_votes
CREATE POLICY "Users can view their own votes" 
ON public.poll_votes 
FOR SELECT 
TO authenticated 
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can vote on polls" 
ON public.poll_votes 
FOR INSERT 
TO authenticated 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for stream_sessions
CREATE POLICY "Users can view their own stream sessions" 
ON public.stream_sessions 
FOR SELECT 
TO authenticated 
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create stream sessions" 
ON public.stream_sessions 
FOR INSERT 
TO authenticated 
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_live_events_updated_at
BEFORE UPDATE ON public.live_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_polls_updated_at
BEFORE UPDATE ON public.community_polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_live_events_status ON public.live_events(status);
CREATE INDEX idx_live_events_scheduled_start ON public.live_events(scheduled_start);
CREATE INDEX idx_event_tickets_event_id ON public.event_tickets(event_id);
CREATE INDEX idx_chat_messages_event_id ON public.chat_messages(event_id);
CREATE INDEX idx_chat_messages_artist_id ON public.chat_messages(artist_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_community_polls_active ON public.community_polls(is_active);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_stream_sessions_event_id ON public.stream_sessions(event_id);

-- Enable realtime for all tables
ALTER TABLE public.live_events REPLICA IDENTITY FULL;
ALTER TABLE public.event_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.community_polls REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;
ALTER TABLE public.stream_sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_sessions;