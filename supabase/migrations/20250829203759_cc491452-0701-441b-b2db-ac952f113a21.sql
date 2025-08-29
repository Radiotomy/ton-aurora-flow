-- Create enhanced role enum with Audius integration
CREATE TYPE public.app_role AS ENUM (
  'fan',
  'audius_artist',
  'verified_audius_artist', 
  'platform_artist',
  'verified_platform_artist',
  'admin'
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
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

-- Create artist applications table
CREATE TABLE public.artist_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('audius_upgrade', 'platform_artist')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  audius_user_id TEXT,
  audius_handle TEXT,
  audius_verification_data JSONB,
  platform_portfolio JSONB,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- RLS Policies for artist_applications
CREATE POLICY "Users can view their own applications" 
ON public.artist_applications 
FOR SELECT 
USING (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can create their own applications" 
ON public.artist_applications 
FOR INSERT 
WITH CHECK (profile_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all applications" 
ON public.artist_applications 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_artist_applications_updated_at
  BEFORE UPDATE ON public.artist_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize all existing users as fans
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'fan'::app_role
FROM public.profiles
WHERE auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;