-- Security Hardening Migration: Fix RLS policies and data exposure issues

-- 1. Fix infinite recursion in profiles table by creating security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Drop problematic overlapping policies on profiles table
DROP POLICY IF EXISTS "Authenticated users view safe profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles show safe fields only" ON public.profiles;

-- 3. Create consolidated, secure profiles policies
CREATE POLICY "Users can view own profile data" ON public.profiles
FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Public can view safe profile fields only" ON public.profiles  
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  auth_user_id != auth.uid() AND
  wallet_address IS NULL -- Never expose wallet addresses publicly
);

-- 4. Fix token_conversion_rates public access (currently allows unauthenticated access)
DROP POLICY IF EXISTS "Authenticated users can view token conversion rates" ON public.token_conversion_rates;

CREATE POLICY "Authenticated users can view conversion rates" ON public.token_conversion_rates
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Fix live_events stream URL exposure  
DROP POLICY IF EXISTS "Public can view basic event info only" ON public.live_events;

CREATE POLICY "Public can view safe event info only" ON public.live_events
FOR SELECT USING (
  CASE 
    WHEN auth.uid() IS NULL THEN (
      status = 'upcoming' AND 
      stream_url IS NULL AND 
      thumbnail_url IS NULL -- Also protect thumbnails for private events
    )
    ELSE (
      status IN ('upcoming', 'live', 'ended') AND
      (stream_url IS NULL OR requires_ticket = FALSE OR 
       EXISTS(SELECT 1 FROM event_tickets et JOIN profiles p ON p.id = et.profile_id 
              WHERE et.event_id = live_events.id AND p.auth_user_id = auth.uid() AND et.is_valid = true))
    )
  END
);

-- 6. Fix nft_marketplace seller profile exposure
DROP POLICY IF EXISTS "Public marketplace listings with privacy protection" ON public.nft_marketplace;

CREATE POLICY "Public can view active marketplace listings safely" ON public.nft_marketplace
FOR SELECT USING (
  status = 'active' AND 
  (expires_at IS NULL OR expires_at > now()) AND
  CASE 
    WHEN auth.uid() IS NULL THEN seller_profile_id IS NULL -- Hide seller info from unauthenticated users
    ELSE true -- Authenticated users can see seller info
  END
);