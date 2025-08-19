-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_tracks table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  track_data JSONB
);

-- Enable Row Level Security
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for playlists
CREATE POLICY "Users can view public playlists or their own playlists" 
ON public.playlists 
FOR SELECT 
USING (
  is_public = true OR 
  profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own playlists" 
ON public.playlists 
FOR INSERT 
WITH CHECK (
  profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own playlists" 
ON public.playlists 
FOR UPDATE 
USING (
  profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own playlists" 
ON public.playlists 
FOR DELETE 
USING (
  profile_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for playlist_tracks
CREATE POLICY "Users can view tracks in accessible playlists" 
ON public.playlist_tracks 
FOR SELECT 
USING (
  playlist_id IN (
    SELECT id FROM public.playlists WHERE 
    is_public = true OR 
    profile_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can add tracks to their own playlists" 
ON public.playlist_tracks 
FOR INSERT 
WITH CHECK (
  playlist_id IN (
    SELECT id FROM public.playlists WHERE 
    profile_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can remove tracks from their own playlists" 
ON public.playlist_tracks 
FOR DELETE 
USING (
  playlist_id IN (
    SELECT id FROM public.playlists WHERE 
    profile_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_playlists_profile_id ON public.playlists(profile_id);
CREATE INDEX idx_playlists_is_public ON public.playlists(is_public);
CREATE INDEX idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON public.playlist_tracks(playlist_id, position);

-- Create trigger for automatic timestamp updates on playlists
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();