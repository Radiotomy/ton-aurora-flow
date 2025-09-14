-- Fix profile creation and authentication linking

-- First, update existing profiles to link them with auth users where possible
UPDATE public.profiles 
SET auth_user_id = auth.users.id
FROM auth.users 
WHERE profiles.auth_user_id IS NULL 
AND auth.users.email IS NOT NULL;

-- Create or replace the trigger function to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Extract display name from metadata or use email
  display_name_value := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Insert new profile for the user
  INSERT INTO public.profiles (auth_user_id, display_name, created_at, updated_at)
  VALUES (NEW.id, display_name_value, NOW(), NOW())
  ON CONFLICT (auth_user_id) DO NOTHING; -- Prevent duplicates
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all current authenticated users have profiles
INSERT INTO public.profiles (auth_user_id, display_name, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data ->> 'display_name', SPLIT_PART(email, '@', 1)),
  NOW(),
  NOW()
FROM auth.users 
WHERE id NOT IN (SELECT auth_user_id FROM public.profiles WHERE auth_user_id IS NOT NULL)
ON CONFLICT (auth_user_id) DO NOTHING;