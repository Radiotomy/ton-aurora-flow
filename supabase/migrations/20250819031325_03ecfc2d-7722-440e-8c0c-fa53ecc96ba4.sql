-- Update profiles table to work with Supabase Auth
-- Add auth_user_id column to link with auth.users
ALTER TABLE public.profiles ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index to ensure one profile per auth user
CREATE UNIQUE INDEX idx_profiles_auth_user_id ON public.profiles(auth_user_id);

-- Create trigger function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  VALUES (NEW.id, display_name_value, NOW(), NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles to have auth_user_id (if any exist)
-- This migration assumes existing profiles should be linked if wallet addresses match
-- In a real scenario, you might need different logic here