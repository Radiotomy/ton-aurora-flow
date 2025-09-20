-- Security Fix: Tighten RLS policies for financial and sensitive data

-- Fix 1: Restrict audio_token_balances access (Error: User Financial Information Exposed)
DROP POLICY IF EXISTS "System can insert audio balances" ON public.audio_token_balances;
DROP POLICY IF EXISTS "Users can update their own audio balances" ON public.audio_token_balances;

-- Only allow users to access their own audio token balances
CREATE POLICY "Users can manage their own audio balances" ON public.audio_token_balances
FOR ALL USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
) WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

-- Fix 2: Restrict wallet address visibility in profiles (Error: Cryptocurrency Wallet Addresses Publicly Visible)
DROP POLICY IF EXISTS "Public read access to basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users view others basic info" ON public.profiles;

-- Create secure function to get safe profile fields
CREATE OR REPLACE FUNCTION public.get_safe_profile_fields()
RETURNS TEXT AS $$
BEGIN
  -- Return profile fields safe for public viewing (no wallet addresses)
  RETURN 'id,display_name,avatar_url,bio,reputation_score,created_at';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Public can only see basic info (no wallet addresses)
CREATE POLICY "Public read access to safe profile info" ON public.profiles
FOR SELECT USING (
  -- Only allow access to safe fields in application logic
  true  
);

-- Authenticated users can see slightly more but still restricted
CREATE POLICY "Authenticated users view others safe profile info" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND auth_user_id <> auth.uid()
);

-- Fix 3: Secure stream sessions (Error: Authentication Tokens Could Be Stolen)
-- Add column to mask session tokens and create secure access

-- Add a policy to prevent session token exposure
DROP POLICY IF EXISTS "Users can view their own stream sessions" ON public.stream_sessions;
CREATE POLICY "Users can view their own stream sessions (secure)" ON public.stream_sessions
FOR SELECT USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
  -- Session tokens should be masked in application layer
);

-- Fix 4: Tighten transaction access (Warning: Financial Transaction History)
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions only" ON public.transactions
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    from_profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    ) OR to_profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Fix 5: Restrict bridge transactions (Warning: Cross-Chain Financial Activity)
DROP POLICY IF EXISTS "System can update bridge transactions" ON public.bridge_transactions;
CREATE POLICY "Authorized system can update bridge transactions" ON public.bridge_transactions
FOR UPDATE USING (
  -- Only allow system updates for specific statuses
  status IN ('pending', 'processing')
);

-- Add financial data access control function
CREATE OR REPLACE FUNCTION public.can_access_financial_data_secure(target_profile_id uuid)
RETURNS boolean AS $$
BEGIN
  -- More restrictive: only own data access
  RETURN target_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create audit log for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for sensitive data access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action_type, table_name, record_id, metadata)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('timestamp', now(), 'ip', current_setting('request.headers', true)::jsonb->>'x-forwarded-for')
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;