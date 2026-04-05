
-- 1. Fix reward self-modification: remove UPDATE policy, rewards should only be modified by server functions
DROP POLICY IF EXISTS "Users can update their own rewards history" ON audio_rewards_history;

-- 2. Fix overly broad storage policies on event-thumbnails
DROP POLICY IF EXISTS "Users can delete own event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own event thumbnails" ON storage.objects;

-- 3. Fix user_roles admin self-assignment: ensure only admins can insert, and block admin role assignment
DROP POLICY IF EXISTS "Admins can assign non-admin roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "System can insert initial roles" ON user_roles;

CREATE POLICY "Only admins can assign non-admin roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND role != 'admin'::app_role
    AND user_id != auth.uid()
  );

-- 4. Fix audit log pollution: remove client INSERT access
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON security_audit_log;

-- 5. Fix validate_data_access always-true in audit log SELECT policy
DROP POLICY IF EXISTS "Verified admins can view audit logs" ON security_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON security_audit_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix broken rate limiting function
CREATE OR REPLACE FUNCTION public.secure_rate_limit_check(
  operation_type text,
  max_operations integer DEFAULT 5,
  time_window interval DEFAULT '00:05:00'::interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile_id uuid;
  recent_count integer;
BEGIN
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF user_profile_id IS NULL THEN
    RETURN false;
  END IF;

  IF operation_type = 'stream_session_create' THEN
    SELECT COUNT(*) INTO recent_count
    FROM stream_sessions
    WHERE profile_id = user_profile_id
      AND joined_at > NOW() - time_window;
  ELSE
    SELECT COUNT(*) INTO recent_count
    FROM transactions
    WHERE from_profile_id = user_profile_id
      AND created_at > NOW() - time_window;
  END IF;

  RETURN recent_count < max_operations;
END;
$$;
