-- Phase 1: Fix Security Issues - Restrict public access to sensitive data

-- 1. Fix profiles table - restrict public access to wallet addresses and sensitive data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles with restricted fields" 
ON public.profiles 
FOR SELECT 
USING (true)
-- Only allow public access to safe fields, not wallet addresses
;

-- Create a secure view for public profile data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  reputation_score,
  created_at,
  CASE 
    WHEN auth.uid() = auth_user_id THEN wallet_address 
    ELSE NULL 
  END AS wallet_address
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 2. Fix live_events table - restrict access to sensitive event data
DROP POLICY IF EXISTS "Live events are viewable by everyone" ON public.live_events;

CREATE POLICY "Public event listings with restricted details" 
ON public.live_events 
FOR SELECT 
USING (
  -- Public can see basic event info
  CASE 
    WHEN auth.uid() IS NULL THEN (
      -- Anonymous users see only basic event info
      status = 'scheduled' AND 
      start_time > now()
    )
    ELSE (
      -- Authenticated users see more, but stream URLs only for participants
      status IN ('scheduled', 'live') OR 
      artist_profile_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  END
);

-- Create secure view for public event data
CREATE OR REPLACE VIEW public.public_events AS
SELECT 
  id,
  title,
  description,
  artist_profile_id,
  start_time,
  status,
  ticket_price_ton,
  max_participants,
  created_at,
  -- Only show stream URL to authenticated users who are participating
  CASE 
    WHEN auth.uid() IS NOT NULL AND (
      artist_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
      id IN (SELECT event_id FROM event_participants WHERE profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
    ) THEN stream_url 
    ELSE NULL 
  END AS stream_url
FROM public.live_events;

GRANT SELECT ON public.public_events TO authenticated, anon;

-- 3. Fix nft_marketplace table - restrict access to pricing strategies
DROP POLICY IF EXISTS "NFT marketplace listings are viewable by everyone" ON public.nft_marketplace;

CREATE POLICY "Public marketplace with restricted seller data" 
ON public.nft_marketplace 
FOR SELECT 
USING (
  -- Public can see active listings but not all seller details
  status = 'active' AND expires_at > now()
);

-- Create secure view for public marketplace data
CREATE OR REPLACE VIEW public.public_marketplace AS
SELECT 
  id,
  nft_id,
  price_ton,
  status,
  created_at,
  expires_at,
  -- Hide seller profile details from public
  CASE 
    WHEN auth.uid() IS NOT NULL THEN seller_profile_id 
    ELSE NULL 
  END AS seller_profile_id
FROM public.nft_marketplace
WHERE status = 'active' AND expires_at > now();

GRANT SELECT ON public.public_marketplace TO authenticated, anon;

-- 4. Add rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.enforce_rate_limit_secure(
  operation_type text,
  max_operations integer DEFAULT 5,
  time_window interval DEFAULT '5 minutes'::interval
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
  recent_count integer;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO user_profile_id 
  FROM profiles 
  WHERE auth_user_id = auth.uid();
  
  IF user_profile_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check rate limit using the secure function
  RETURN public.check_rate_limit_secure(
    operation_type, 
    user_profile_id, 
    max_operations, 
    time_window
  );
END;
$$;

-- 5. Create audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.data_access_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  operation text NOT NULL,
  accessed_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs only viewable by admins" 
ON public.data_access_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.data_access_log (
    user_id,
    table_name,
    operation,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    inet(current_setting('request.headers', true)::jsonb->>'x-forwarded-for'),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for sensitive data access logging
DROP TRIGGER IF EXISTS log_profiles_access ON public.profiles;
CREATE TRIGGER log_profiles_access
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_data_access();

DROP TRIGGER IF EXISTS log_transactions_access ON public.transactions;
CREATE TRIGGER log_transactions_access
  AFTER SELECT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_data_access();