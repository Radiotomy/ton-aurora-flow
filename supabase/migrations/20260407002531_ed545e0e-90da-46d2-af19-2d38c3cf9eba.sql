
-- Fix: Admins can update their own role records (privilege escalation)
-- Add user_id <> auth.uid() to the UPDATE policy
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;

CREATE POLICY "Admins can update non-admin roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND user_id <> auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND role <> 'admin'::app_role
    AND user_id <> auth.uid()
  );
