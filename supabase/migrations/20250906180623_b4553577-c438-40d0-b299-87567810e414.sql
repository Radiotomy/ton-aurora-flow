-- Create user connections (follow system)
CREATE TABLE public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, track_id)
);

-- Create track comments table
CREATE TABLE public.track_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reply_to_id UUID,
  is_deleted BOOLEAN DEFAULT false
);

-- Create user recommendations table
CREATE TABLE public.user_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'ai_generated', 'similar_users', 'trending'
  score NUMERIC DEFAULT 0.5,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS on all tables
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_connections
CREATE POLICY "Users can view all connections" 
ON public.user_connections 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own connections" 
ON public.user_connections 
FOR INSERT 
WITH CHECK (follower_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
));

CREATE POLICY "Users can delete their own connections" 
ON public.user_connections 
FOR DELETE 
USING (follower_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
));

-- RLS Policies for user_favorites
CREATE POLICY "Users can view all favorites" 
ON public.user_favorites 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own favorites" 
ON public.user_favorites 
FOR ALL 
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
));

-- RLS Policies for track_comments
CREATE POLICY "Users can view all comments" 
ON public.track_comments 
FOR SELECT 
USING (is_deleted = false);

CREATE POLICY "Users can create comments" 
ON public.track_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
);

CREATE POLICY "Users can update their own comments" 
ON public.track_comments 
FOR UPDATE 
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
));

-- RLS Policies for user_recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.user_recommendations 
FOR SELECT 
USING (profile_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
));

CREATE POLICY "System can manage recommendations" 
ON public.user_recommendations 
FOR ALL 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_track_comments_updated_at
  BEFORE UPDATE ON public.track_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_user_connections_follower ON public.user_connections(follower_id);
CREATE INDEX idx_user_connections_following ON public.user_connections(following_id);
CREATE INDEX idx_user_favorites_profile ON public.user_favorites(profile_id);
CREATE INDEX idx_user_favorites_track ON public.user_favorites(track_id);
CREATE INDEX idx_track_comments_track ON public.track_comments(track_id);
CREATE INDEX idx_track_comments_profile ON public.track_comments(profile_id);
CREATE INDEX idx_user_recommendations_profile ON public.user_recommendations(profile_id);
CREATE INDEX idx_user_recommendations_expires ON public.user_recommendations(expires_at);