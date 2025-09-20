-- Fix function search path security warnings

-- Fix 1: Update get_safe_profile_fields function
CREATE OR REPLACE FUNCTION public.get_safe_profile_fields()
RETURNS TEXT AS $$
BEGIN
  -- Return profile fields safe for public viewing (no wallet addresses)
  RETURN 'id,display_name,avatar_url,bio,reputation_score,created_at';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix 2: Update can_access_financial_data_secure function  
CREATE OR REPLACE FUNCTION public.can_access_financial_data_secure(target_profile_id uuid)
RETURNS boolean AS $$
BEGIN
  -- More restrictive: only own data access
  RETURN target_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix 3: Update log_sensitive_access function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;