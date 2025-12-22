-- Add IPFS storage columns to live_events table
-- Phase 1: IPFS via Pinata
-- Phase 2 Ready: Columns for TON Storage integration

ALTER TABLE public.live_events
ADD COLUMN IF NOT EXISTS thumbnail_ipfs_cid text,
ADD COLUMN IF NOT EXISTS recording_ipfs_cid text,
ADD COLUMN IF NOT EXISTS recording_duration integer,
ADD COLUMN IF NOT EXISTS recording_size bigint,
-- Phase 2: TON Storage fields (prepared for future use)
ADD COLUMN IF NOT EXISTS thumbnail_ton_bag_id text,
ADD COLUMN IF NOT EXISTS recording_ton_bag_id text,
ADD COLUMN IF NOT EXISTS storage_type text DEFAULT 'supabase';

-- Add comment for documentation
COMMENT ON COLUMN public.live_events.thumbnail_ipfs_cid IS 'IPFS CID for event thumbnail (Pinata)';
COMMENT ON COLUMN public.live_events.recording_ipfs_cid IS 'IPFS CID for event recording (Pinata)';
COMMENT ON COLUMN public.live_events.recording_duration IS 'Recording duration in seconds';
COMMENT ON COLUMN public.live_events.recording_size IS 'Recording file size in bytes';
COMMENT ON COLUMN public.live_events.thumbnail_ton_bag_id IS 'Phase 2: TON Storage Bag ID for thumbnail';
COMMENT ON COLUMN public.live_events.recording_ton_bag_id IS 'Phase 2: TON Storage Bag ID for recording';
COMMENT ON COLUMN public.live_events.storage_type IS 'Storage backend: supabase, ipfs, ton, hybrid';

-- Create index for efficient lookups by storage type
CREATE INDEX IF NOT EXISTS idx_live_events_storage_type ON public.live_events(storage_type);
CREATE INDEX IF NOT EXISTS idx_live_events_ipfs_cid ON public.live_events(recording_ipfs_cid) WHERE recording_ipfs_cid IS NOT NULL;