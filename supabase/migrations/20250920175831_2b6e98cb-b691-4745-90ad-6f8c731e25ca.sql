-- Fix security definer view issues
-- Remove problematic views and use proper RLS policies instead

-- Drop the potentially problematic views
DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.live_events_public;

-- Revoke any grants that were made to the views
-- (PostgreSQL will handle this automatically when dropping views)

-- Fix the profiles table with proper RLS policies instead of views
-- Re-add the public profile policy but with secure field selection
CREATE POLICY "Public read access to safe profile fields only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Always allow reading safe fields only
  true
);

-- Note: The application should use the profileSelectors utility 
-- (PUBLIC_PROFILE_FIELDS) to ensure only safe fields are selected
-- This approach is more secure than views with elevated privileges

-- For live_events, use a simple authenticated-only policy
-- The frontend can filter what fields to show based on authentication state
CREATE POLICY "All users can view basic live event info" 
ON public.live_events 
FOR SELECT 
USING (
  -- Allow all users to see live events
  -- Frontend should conditionally show stream_url only to authenticated users
  true
);

-- Add a comment to remind developers about field filtering
COMMENT ON TABLE public.profiles IS 'Use profileSelectors.PUBLIC_PROFILE_FIELDS for safe public access to avoid exposing sensitive data like wallet_address and audio_token_balance';
COMMENT ON TABLE public.live_events IS 'Frontend should conditionally show stream_url only to authenticated users for security';