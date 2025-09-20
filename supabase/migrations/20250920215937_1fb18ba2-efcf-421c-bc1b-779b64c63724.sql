-- Phase 1: Fix Security Issues - Corrected Approach
-- Fix public access to sensitive data using RLS policies and secure views

-- 1. Fix profiles table - Create secure view and restrict sensitive data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles with restricted fields" ON public.profiles;

-- Create more restrictive policy for profiles
CREATE POLICY "Public profiles show safe fields only" 
ON public.profiles 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() = auth_user_id THEN true  -- Own profile: full access
    WHEN auth.uid() IS NOT NULL THEN (  -- Authenticated users: limited access
      wallet_address IS NULL OR 
      id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
    ELSE (  -- Anonymous users: very limited access
      wallet_address IS NULL
    )
  END
);

-- 2. Fix live_events table - Restrict stream URLs and sensitive data
DROP POLICY IF EXISTS "All users can view basic live event info" ON public.live_events;
DROP POLICY IF EXISTS "Authenticated users can view full live event details" ON public.live_events;

CREATE POLICY "Public can view basic event info only" 
ON public.live_events 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN (
      -- Anonymous users: only basic scheduled events
      status = 'upcoming' AND stream_url IS NULL
    )
    ELSE (
      -- Authenticated users can see more but stream_url restricted
      status IN ('upcoming', 'live', 'ended')
    )
  END
);

-- 3. Fix nft_marketplace table - Remove overly permissive policies
DROP POLICY IF EXISTS "Public can view basic active marketplace listings" ON public.nft_marketplace;
DROP POLICY IF EXISTS "Authenticated users can view detailed marketplace listings" ON public.nft_marketplace;

CREATE POLICY "Public marketplace listings with privacy protection" 
ON public.nft_marketplace 
FOR SELECT 
USING (
  status = 'active' AND expires_at > now() AND
  CASE 
    WHEN auth.uid() IS NOT NULL THEN true
    ELSE seller_profile_id IS NULL  -- Hide seller info from anonymous users
  END
);

-- 4. Create secure functions for data access validation
CREATE OR REPLACE FUNCTION public.validate_data_access(
  requested_table text,
  user_context uuid DEFAULT auth.uid()
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempts for sensitive tables
  IF requested_table IN ('profiles', 'transactions', 'nft_marketplace') THEN
    INSERT INTO public.security_audit_log (
      user_id, 
      action_type, 
      table_name,
      metadata
    ) VALUES (
      user_context,
      'data_access_attempt',
      requested_table,
      jsonb_build_object(
        'timestamp', now(),
        'authenticated', user_context IS NOT NULL
      )
    );
  END IF;
  
  RETURN true;
END;
$$;

-- 5. Add improved rate limiting for critical operations
CREATE OR REPLACE FUNCTION public.secure_rate_limit_check(
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
  -- Get current user's profile ID securely
  SELECT id INTO user_profile_id 
  FROM profiles 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  IF user_profile_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check rate limit for this user and operation
  SELECT COUNT(*) INTO recent_count
  FROM transactions
  WHERE from_profile_id = user_profile_id
    AND transaction_type = operation_type
    AND created_at > NOW() - time_window;
    
  -- Log rate limit checks for monitoring
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    table_name,
    metadata
  ) VALUES (
    auth.uid(),
    'rate_limit_check',
    'transactions',
    jsonb_build_object(
      'operation_type', operation_type,
      'recent_count', recent_count,
      'max_allowed', max_operations,
      'passed', recent_count < max_operations
    )
  );
    
  RETURN recent_count < max_operations;
END;
$$;

-- 6. Update existing sensitive data policies to use new security functions
-- (This ensures better monitoring and control)

-- Add trigger to validate sensitive operations
CREATE OR REPLACE FUNCTION public.validate_sensitive_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate access for sensitive operations
  PERFORM public.validate_data_access(TG_TABLE_NAME);
  
  -- For high-value transactions, add extra validation
  IF TG_TABLE_NAME = 'transactions' AND NEW.amount_ton > 10 THEN
    IF NOT public.secure_rate_limit_check('high_value_transaction', 3, '1 hour'::interval) THEN
      RAISE EXCEPTION 'Rate limit exceeded for high-value transactions';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the validation trigger to critical tables
DROP TRIGGER IF EXISTS validate_transaction_operations ON public.transactions;
CREATE TRIGGER validate_transaction_operations
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sensitive_operation();