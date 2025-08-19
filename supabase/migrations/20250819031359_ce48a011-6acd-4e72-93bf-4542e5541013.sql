-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
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
  VALUES (NEW.id, display_name_value, NOW(), NOW());
  
  RETURN NEW;
END;
$$;