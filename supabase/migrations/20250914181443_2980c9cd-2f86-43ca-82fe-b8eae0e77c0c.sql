-- Fix security issue with function search path
CREATE OR REPLACE FUNCTION update_conversion_rates()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This function can be enhanced to fetch real-time rates from external APIs
  UPDATE token_conversion_rates 
  SET updated_at = now()
  WHERE updated_at < now() - interval '1 hour';
END;
$$;