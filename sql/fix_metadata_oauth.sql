-- Fix OAuth user metadata capture and RLS policies
-- This ensures OAuth users get metadata and can read it

-- 1. Verify and fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users_metadata (
    id,
    email,
    full_name,
    subscription_status,
    product_limit,
    current_product_count
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'free',
    3,
    0
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User metadata already exists, skip
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the trigger
    RAISE WARNING 'Error creating user metadata for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Drop all existing RLS policies on users_metadata
DROP POLICY IF EXISTS "users_metadata_select" ON public.users_metadata;
DROP POLICY IF EXISTS "Users view own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "Users update own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "users_metadata_insert" ON public.users_metadata;
DROP POLICY IF EXISTS "users_select_own" ON public.users_metadata;
DROP POLICY IF EXISTS "users_update_own" ON public.users_metadata;

-- 4. Enable RLS
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- 5. Create new, simple policies
CREATE POLICY "authenticated_users_read_own"
  ON public.users_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "authenticated_users_update_own"
  ON public.users_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions
GRANT SELECT, UPDATE ON public.users_metadata TO authenticated;
GRANT ALL ON public.users_metadata TO service_role;

-- 7. Check if current user has metadata (run this manually after login)
-- SELECT * FROM users_metadata WHERE id = auth.uid();

-- 8. List all users and their metadata
SELECT
  u.id,
  u.email,
  u.created_at as user_created,
  um.email as metadata_email,
  um.subscription_status,
  um.product_limit,
  um.current_product_count,
  um.created_at as metadata_created
FROM auth.users u
LEFT JOIN public.users_metadata um ON u.id = um.id
ORDER BY u.created_at DESC;
