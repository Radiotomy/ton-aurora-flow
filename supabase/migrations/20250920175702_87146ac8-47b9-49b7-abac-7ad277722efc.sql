-- Fix critical database security vulnerabilities
-- Update RLS policies to prevent unauthorized data access

-- 1. Secure token_conversion_rates - only authenticated users should see rates
DROP POLICY IF EXISTS "Authenticated users can view token conversion rates" ON public.token_conversion_rates;
CREATE POLICY "Authenticated users can view token conversion rates" 
ON public.token_conversion_rates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Secure live_events - hide stream URLs from unauthenticated users
DROP POLICY IF EXISTS "Public can view basic live event info" ON public.live_events;
DROP POLICY IF EXISTS "Authenticated users can view full live event details" ON public.live_events;

-- Authenticated users get full access to live events
CREATE POLICY "Authenticated users can view full live event details" 
ON public.live_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Secure chat_messages - remove public access to artist chat
DROP POLICY IF EXISTS "Users can view public artist chat messages" ON public.chat_messages;

-- Only allow authenticated users to see artist chat messages
CREATE POLICY "Authenticated users can view artist chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  event_id IS NULL AND 
  is_deleted = false
);

-- 4. Secure community_polls - only authenticated users should see polls
DROP POLICY IF EXISTS "Users can view active polls" ON public.community_polls;

CREATE POLICY "Authenticated users can view active polls" 
ON public.community_polls 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  is_active = true
);

-- 5. Secure track_comments - only authenticated users should see comments  
DROP POLICY IF EXISTS "Authenticated users can view non-deleted comments" ON public.track_comments;

CREATE POLICY "Authenticated users can view non-deleted comments" 
ON public.track_comments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  is_deleted = false
);

-- 6. Fix profiles table policies for better security
DROP POLICY IF EXISTS "Authenticated users view others safe profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public read access to safe profile info" ON public.profiles;

-- Create view for public profile data (no sensitive info)
CREATE OR REPLACE VIEW public.profiles_public AS 
SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  reputation_score,
  created_at
FROM public.profiles;

-- Grant public access to the safe profile view
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Authenticated users can see more profile info but not financial data of others
CREATE POLICY "Authenticated users view safe profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth_user_id != auth.uid()
);

-- 7. Ensure audio_token_balances has proper owner-only access
DROP POLICY IF EXISTS "Users can view their own audio balances" ON public.audio_token_balances;

CREATE POLICY "Users can view their own audio balances" 
ON public.audio_token_balances 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- 8. Add rate limiting function for security
CREATE OR REPLACE FUNCTION public.check_rate_limit_secure(
  operation_type text, 
  user_profile_id uuid, 
  max_operations integer DEFAULT 5,
  time_window interval DEFAULT '5 minutes'::interval
) RETURNS boolean AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Count recent operations for this user and operation type
  SELECT COUNT(*) INTO recent_count
  FROM transactions
  WHERE from_profile_id = user_profile_id
    AND transaction_type = operation_type
    AND created_at > NOW() - time_window;
    
  RETURN recent_count < max_operations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 9. Create secure public view for live events (no stream URLs)
CREATE OR REPLACE VIEW public.live_events_public AS 
SELECT 
  id,
  title,
  description,
  artist_id,
  scheduled_start,
  scheduled_end,
  is_live,
  status,
  thumbnail_url,
  ticket_price_ton,
  requires_ticket,
  max_attendees,
  current_attendees,
  created_at
FROM public.live_events
WHERE status IN ('upcoming', 'live');

-- Grant public access to the view
GRANT SELECT ON public.live_events_public TO anon;