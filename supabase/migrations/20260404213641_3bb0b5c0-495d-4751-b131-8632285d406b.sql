
-- audio_token_balances: remove the ALL policy that lets users manipulate their own balances
-- Keep only the SELECT policy for reading
DROP POLICY IF EXISTS "Users can manage their own audio balances" ON public.audio_token_balances;

-- Also tighten security_audit_log INSERT to authenticated only (it already is, but make the check proper)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.security_audit_log FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
