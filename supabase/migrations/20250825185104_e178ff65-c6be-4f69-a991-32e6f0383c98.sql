-- Create missing database tables for Phase 1

-- Community Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id),
    artist_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES public.chat_messages(id)
);

-- Community Polls Table
CREATE TABLE public.community_polls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id),
    artist_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    total_votes INTEGER DEFAULT 0
);

-- Poll Votes Table
CREATE TABLE public.poll_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id),
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(poll_id, profile_id)
);

-- Live Events Table
CREATE TABLE public.live_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    stream_url TEXT,
    thumbnail_url TEXT,
    is_live BOOLEAN DEFAULT false,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    ticket_price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
CREATE POLICY "Users can view chat messages for accessible communities"
    ON public.chat_messages FOR SELECT
    USING (true); -- Public chat for now

CREATE POLICY "Authenticated users can send chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can update their own chat messages"
    ON public.chat_messages FOR UPDATE
    USING (
        profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Community Polls Policies
CREATE POLICY "Users can view active polls"
    ON public.community_polls FOR SELECT
    USING (is_active = true);

CREATE POLICY "Authenticated users can create polls"
    ON public.community_polls FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can update their own polls"
    ON public.community_polls FOR UPDATE
    USING (
        profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Poll Votes Policies
CREATE POLICY "Users can view poll votes"
    ON public.poll_votes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can vote on polls"
    ON public.poll_votes FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Live Events Policies  
CREATE POLICY "Users can view live events"
    ON public.live_events FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create events"
    ON public.live_events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Event creators can update their events"
    ON public.live_events FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at columns
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_events_updated_at
    BEFORE UPDATE ON public.live_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_chat_messages_artist_id ON public.chat_messages(artist_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_community_polls_artist_id ON public.community_polls(artist_id);
CREATE INDEX idx_community_polls_expires_at ON public.community_polls(expires_at);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_live_events_artist_id ON public.live_events(artist_id);
CREATE INDEX idx_live_events_scheduled_start ON public.live_events(scheduled_start);
CREATE INDEX idx_live_events_is_live ON public.live_events(is_live);