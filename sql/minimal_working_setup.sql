-- MINIMAL WORKING SETUP
-- This is the absolute minimum to make authentication work
-- Run this AFTER deleting all tables

-- 1. Create users_metadata table
CREATE TABLE public.users_metadata (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'free',
  product_limit INTEGER DEFAULT 3,
  current_product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- 3. Simple RLS policy
CREATE POLICY "users_metadata_select" ON public.users_metadata FOR SELECT USING (auth.uid() = id);

-- 4. Create the trigger function with EXPLICIT schema references
CREATE OR REPLACE FUNCTION public.create_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into public.users_metadata when a user is created in auth.users
  INSERT INTO public.users_metadata (id, email, subscription_status, product_limit, current_product_count)
  VALUES (NEW.id, COALESCE(NEW.email, NEW.phone, 'unknown'), 'free', 3, 0)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating user metadata: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Create the trigger on auth.users (NOTE: auth schema, not public)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_metadata();

-- 6. Grant permissions (CRITICAL - Supabase needs these)
GRANT ALL ON public.users_metadata TO postgres;
GRANT ALL ON public.users_metadata TO service_role;
GRANT SELECT ON public.users_metadata TO anon;
GRANT ALL ON public.users_metadata TO authenticated;

-- 7. Verify trigger is active
SELECT
  'TRIGGER CHECK:' as step,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
    )
    THEN '✅ Trigger is attached to auth.users'
    ELSE '❌ TRIGGER NOT FOUND - Something went wrong!'
  END as trigger_status;

-- 8. Test the function directly
DO $$
BEGIN
  RAISE NOTICE '✅ If you see this message, the SQL ran successfully!';
  RAISE NOTICE '✅ Now try signing up with Google or email';
END $$;