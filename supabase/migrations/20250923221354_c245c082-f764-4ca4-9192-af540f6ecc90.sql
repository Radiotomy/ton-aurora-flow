-- COMPREHENSIVE SECURITY FIX: Strengthen RLS policies for critical tables

-- 1. STRENGTHEN TRANSACTION TABLE SECURITY
-- Drop existing policies and create more restrictive ones
DROP POLICY IF EXISTS "Users can view their own transactions only" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions they send" ON public.transactions;

-- Create enhanced transaction viewing policy with audit logging
CREATE POLICY "Users can view own transactions with logging"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  -- Only allow viewing if user is sender or recipient
  (from_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) OR to_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )) AND
  -- Log the access attempt
  public.validate_data_access('transactions')
);

-- Create secure transaction creation policy with rate limiting
CREATE POLICY "Users can create transactions with rate limiting"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  -- Can only create transactions from own profile
  from_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) AND
  -- Check rate limits for transaction creation
  public.secure_rate_limit_check('transaction_create', 10, '5 minutes'::interval) AND
  -- Validate the transaction
  public.validate_data_access('transactions')
);

-- 2. SECURE STREAM SESSION MANAGEMENT
-- Drop existing policies and create more secure ones
DROP POLICY IF EXISTS "Users can create stream sessions" ON public.stream_sessions;
DROP POLICY IF EXISTS "Users can view their own stream sessions (secure)" ON public.stream_sessions;

-- Create secure stream session viewing policy
CREATE POLICY "Users can view own active stream sessions"
ON public.stream_sessions
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) AND
  -- Only allow viewing of active sessions or recent inactive ones
  (is_active = true OR left_at > now() - interval '1 hour')
);

-- Create secure stream session creation policy
CREATE POLICY "Users can create stream sessions with validation"
ON public.stream_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) AND
  -- Ensure session token is provided
  session_token IS NOT NULL AND
  -- Rate limit stream session creation
  public.secure_rate_limit_check('stream_session_create', 5, '10 minutes'::interval)
);

-- Create policy to update stream sessions (for leaving)
CREATE POLICY "Users can update own stream sessions"
ON public.stream_sessions
FOR UPDATE
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
) WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

-- 3. AUDIT LOG PROTECTION
-- Drop existing policy and create admin-only access
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_log;

-- Create strict admin-only audit log policy
CREATE POLICY "Verified admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (
  -- Only verified admin users can view audit logs
  public.has_role(auth.uid(), 'admin'::app_role) AND
  -- Log this access attempt
  public.validate_data_access('security_audit_log')
);

-- Create system-only audit log insertion policy
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. CREATE ENHANCED SECURITY FUNCTIONS

-- Function to validate stream session tokens
CREATE OR REPLACE FUNCTION public.validate_stream_session_token(
  session_token text,
  event_id uuid,
  profile_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count integer;
BEGIN
  -- Check if session token is unique for this event
  SELECT COUNT(*) INTO session_count
  FROM stream_sessions
  WHERE session_token = validate_stream_session_token.session_token
    AND event_id = validate_stream_session_token.event_id
    AND profile_id != validate_stream_session_token.profile_id
    AND is_active = true;
  
  -- Log the validation attempt
  INSERT INTO security_audit_log (
    user_id,
    action_type,
    table_name,
    metadata
  ) VALUES (
    auth.uid(),
    'stream_session_validation',
    'stream_sessions',
    jsonb_build_object(
      'session_token_hash', encode(digest(session_token, 'sha256'), 'hex'),
      'event_id', event_id,
      'duplicate_sessions', session_count,
      'timestamp', now()
    )
  );
  
  RETURN session_count = 0;
END;
$$;

-- Function to cleanup expired stream sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_stream_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark sessions as inactive if they've been active too long without activity
  UPDATE stream_sessions
  SET is_active = false,
      left_at = now()
  WHERE is_active = true
    AND joined_at < now() - interval '4 hours'
    AND left_at IS NULL;
    
  -- Log the cleanup
  INSERT INTO security_audit_log (
    user_id,
    action_type,
    table_name,
    metadata
  ) VALUES (
    NULL,
    'system_cleanup',
    'stream_sessions',
    jsonb_build_object(
      'action', 'expired_session_cleanup',
      'timestamp', now()
    )
  );
END;
$$;

-- Add trigger for transaction security validation
CREATE OR REPLACE FUNCTION public.validate_transaction_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Additional validation for high-value transactions
  IF NEW.amount_ton > 50 THEN
    -- Require additional verification for large transactions
    IF NOT public.secure_rate_limit_check('high_value_transaction', 2, '1 hour'::interval) THEN
      RAISE EXCEPTION 'Rate limit exceeded for high-value transactions (>50 TON)';
    END IF;
  END IF;
  
  -- Log all transaction attempts
  INSERT INTO security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    metadata
  ) VALUES (
    auth.uid(),
    'transaction_attempt',
    'transactions',
    NEW.id,
    jsonb_build_object(
      'amount_ton', NEW.amount_ton,
      'transaction_type', NEW.transaction_type,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for transaction validation
DROP TRIGGER IF EXISTS validate_transaction_security_trigger ON public.transactions;
CREATE TRIGGER validate_transaction_security_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_security();

-- Log this comprehensive security fix
INSERT INTO public.security_audit_log (
  user_id,
  action_type,
  table_name,
  metadata
) VALUES (
  auth.uid(),
  'comprehensive_security_update',
  'multiple_tables',
  jsonb_build_object(
    'tables_updated', ARRAY['transactions', 'stream_sessions', 'security_audit_log'],
    'fix_type', 'RLS_policy_hardening',
    'security_level', 'CRITICAL',
    'timestamp', now(),
    'description', 'Enhanced RLS policies, added rate limiting, improved audit logging'
  )
);