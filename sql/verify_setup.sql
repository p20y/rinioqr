-- Verify Database Setup
-- Run this to check if everything is configured correctly

-- Check tables exist
SELECT
  'Tables Check' as test,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_metadata') THEN '✅ users_metadata exists'
    ELSE '❌ users_metadata missing'
  END as users_metadata_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN '✅ subscription_plans exists'
    ELSE '❌ subscription_plans missing'
  END as subscription_plans_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN '✅ products exists'
    ELSE '❌ products missing'
  END as products_table;

-- Check triggers exist
SELECT
  'Triggers Check' as test,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN '✅ User creation trigger active'
    ELSE '❌ User creation trigger MISSING'
  END as user_trigger,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'product_count_trigger') THEN '✅ Product count trigger active'
    ELSE '❌ Product count trigger MISSING'
  END as product_trigger;

-- Check subscription plans seeded
SELECT
  'Subscription Plans' as test,
  COUNT(*) as total_plans,
  string_agg(name, ', ' ORDER BY product_limit) as plan_names
FROM public.subscription_plans;

-- Check user metadata structure
SELECT
  'User Metadata Columns' as test,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'users_metadata'
AND table_schema = 'public';

-- Check for existing users and metadata
SELECT
  'Users Status' as test,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users_metadata) as users_with_metadata,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users_metadata)
    THEN '✅ All users have metadata'
    WHEN (SELECT COUNT(*) FROM auth.users) = 0
    THEN '✅ No users yet (fresh start)'
    ELSE '⚠️ Some users missing metadata'
  END as status;