-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 6
      WHEN 'verified_platform_artist' THEN 5
      WHEN 'platform_artist' THEN 4
      WHEN 'verified_audius_artist' THEN 3
      WHEN 'audius_artist' THEN 2
      WHEN 'fan' THEN 1
    END DESC
  LIMIT 1
$$;