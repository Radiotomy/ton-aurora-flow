-- Create the trigger function for automatic profile creation
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
  
  -- Insert new profile for the user, ignore conflicts
  INSERT INTO public.profiles (auth_user_id, display_name, created_at, updated_at)
  VALUES (NEW.id, display_name_value, NOW(), NOW())
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();