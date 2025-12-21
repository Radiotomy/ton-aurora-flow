-- Add creator_profile_id to properly link events to artist profiles
ALTER TABLE live_events 
ADD COLUMN IF NOT EXISTS creator_profile_id UUID REFERENCES profiles(id);

-- Create storage bucket for event thumbnails if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-thumbnails', 'event-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload event thumbnails
CREATE POLICY "Authenticated users can upload event thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-thumbnails' AND auth.uid() IS NOT NULL);

-- Allow public access to view event thumbnails
CREATE POLICY "Public can view event thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-thumbnails');

-- Allow users to update their own event thumbnails
CREATE POLICY "Users can update own event thumbnails"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-thumbnails' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own event thumbnails
CREATE POLICY "Users can delete own event thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-thumbnails' AND auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_live_events_creator ON live_events(creator_profile_id);