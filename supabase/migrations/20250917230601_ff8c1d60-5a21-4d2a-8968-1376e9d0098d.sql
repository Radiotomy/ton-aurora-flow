-- Create only the missing tables for live events system

-- Event tickets table (missing)
CREATE TABLE IF NOT EXISTS public.event_tickets (
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

-- Live stream sessions table for WebRTC management (missing)
CREATE TABLE IF NOT EXISTS public.stream_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  peer_id TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add status column to live_events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_events' AND column_name = 'status') THEN
        ALTER TABLE public.live_events ADD COLUMN status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended'));
    END IF;
    
    -- Add ticket_price_ton column to live_events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_events' AND column_name = 'ticket_price_ton') THEN
        ALTER TABLE public.live_events ADD COLUMN ticket_price_ton DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add requires_ticket column to live_events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_events' AND column_name = 'requires_ticket') THEN
        ALTER TABLE public.live_events ADD COLUMN requires_ticket BOOLEAN DEFAULT false;
    END IF;
    
    -- Add message_type column to chat_messages if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.chat_messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'tip', 'join', 'reaction'));
    END IF;
    
    -- Add metadata column to chat_messages if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'metadata') THEN
        ALTER TABLE public.chat_messages ADD COLUMN metadata JSONB;
    END IF;
    
    -- Add event_id column to chat_messages if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'event_id') THEN
        ALTER TABLE public.chat_messages ADD COLUMN event_id UUID REFERENCES public.live_events(id) ON DELETE CASCADE;
    END IF;
    
    -- Add poll_type column to community_polls if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_polls' AND column_name = 'poll_type') THEN
        ALTER TABLE public.community_polls ADD COLUMN poll_type TEXT NOT NULL DEFAULT 'general' CHECK (poll_type IN ('general', 'artist', 'event', 'feature'));
    END IF;
    
    -- Add requires_wallet column to community_polls if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_polls' AND column_name = 'requires_wallet') THEN
        ALTER TABLE public.community_polls ADD COLUMN requires_wallet BOOLEAN DEFAULT false;
    END IF;
    
    -- Add description column to community_polls if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_polls' AND column_name = 'description') THEN
        ALTER TABLE public.community_polls ADD COLUMN description TEXT;
    END IF;

END $$;

-- Enable Row Level Security on new tables
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON public.event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_event_id ON public.stream_sessions(event_id);

-- Enable realtime for new tables
ALTER TABLE public.event_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.stream_sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_sessions;