-- Update trigger to capture full_name from OAuth providers (Google)
-- This extracts the full_name from user metadata when signing up with Google

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name_value TEXT;
BEGIN
  -- Extract full_name from raw_user_meta_data if available (OAuth providers like Google)
  full_name_value := NEW.raw_user_meta_data->>'full_name';

  -- Insert into users_metadata with default free plan
  INSERT INTO public.users_metadata (
    id,
    email,
    full_name,
    subscription_status,
    product_limit,
    current_product_count,
    total_scans
  )
  VALUES (
    NEW.id,
    NEW.email,
    full_name_value, -- Will be NULL for email signups, populated for OAuth
    'free',
    3,
    0,
    0
  );

  RETURN NEW;
END;
$$;

-- Verify the trigger is active
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
