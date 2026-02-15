-- Test if the trigger is properly configured
-- This checks the exact trigger configuration

-- 1. Check if trigger exists and is attached to auth.users
SELECT
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if the function exists
SELECT
  routine_schema,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'create_user_metadata';

-- 3. Check RLS on users_metadata
SELECT
  tablename,
  schemaname,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users_metadata';

-- 4. List all policies on users_metadata
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users_metadata';