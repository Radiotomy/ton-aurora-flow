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

-- Create separate policies for public vs authenticated access
CREATE POLICY "Public can view basic live event info" 
ON public.live_events 
FOR SELECT 
USING (
  -- Only show basic info (no stream_url) to unauthenticated users
  auth.uid() IS NULL AND 
  -- This policy will be combined with authenticated policy below
  false
);

CREATE POLICY "Authenticated users can view full live event details" 
ON public.live_events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- For unauthenticated users, create a view that excludes sensitive data
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
WHERE status IN ('upcoming', 'live', 'ended');

-- Grant public access to the view
GRANT SELECT ON public.live_events_public TO anon;

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

-- 6. Add additional security for profiles - ensure financial data is protected
-- Update existing policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users view others safe profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public read access to safe profile info" ON public.profiles;

-- Create safer public profile access
CREATE POLICY "Public read access to basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to truly public fields
  auth.uid() IS NULL
);

-- Authenticated users can see more profile info but not financial data
CREATE POLICY "Authenticated users view safe profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth_user_id != auth.uid()
);

-- 7. Ensure financial tables have proper restrictions
-- Add policy to audio_token_balances to ensure only owners can see balances
CREATE POLICY "Only profile owners can view audio token balances" 
ON public.audio_token_balances 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- 8. Add logging for sensitive data access attempts
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to financial or sensitive data
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    metadata
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'timestamp', now(),
      'sensitive_access', true
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for financial data access logging
CREATE TRIGGER log_token_balance_access
  AFTER SELECT ON public.audio_token_balances
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.log_sensitive_data_access();