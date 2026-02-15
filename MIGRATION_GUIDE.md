# Database Migration Guide - Phase 1: Authentication & Multi-Tenancy

This guide explains how to run the database migrations for Phase 1 of the SaaS transformation.

## Prerequisites

- Access to Supabase Dashboard
- Backup of current database (recommended)
- No users are actively using the application during migration

## Step 1: Backup Current Database

1. Go to Supabase Dashboard > Database > Backups
2. Create a manual backup before proceeding
3. Wait for backup to complete

## Step 2: Handle Existing Products

**IMPORTANT:** The migration adds a `user_id` column to the products table. If you have existing products:

### Option A: No existing products
- Skip to Step 3

### Option B: Have existing products
You need to decide what to do with them:

1. **Delete all existing products** (if this is a development/test environment):
   ```sql
   DELETE FROM products;
   ```

2. **Assign to a test user** (recommended for development):
   - First, create a test user account through the signup page
   - Get the user ID from Supabase Dashboard > Authentication > Users
   - Run this SQL before the migration:
   ```sql
   -- Replace YOUR_USER_ID with actual user ID
   ALTER TABLE products ADD COLUMN user_id UUID;
   UPDATE products SET user_id = 'YOUR_USER_ID';
   ```

## Step 3: Run the Migration

1. Go to Supabase Dashboard > SQL Editor
2. Create a new query
3. Copy the entire contents of `supabase/migrations/001_auth_multitenancy.sql`
4. Paste into the SQL Editor
5. Click "Run"
6. Check for any errors in the results panel

## Step 4: Verify Migration

Run these verification queries:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users_metadata', 'subscription_plans');

-- Check if subscription plans were seeded
SELECT name, display_name, product_limit FROM subscription_plans;

-- Check if RLS policies exist
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('products', 'users_metadata', 'subscription_plans');

-- Check if triggers were created
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE event_object_schema = 'public';
```

Expected results:
- Both tables should exist
- 4 subscription plans (free, starter, pro, enterprise)
- Multiple RLS policies for each table
- Triggers: on_auth_user_created, product_count_trigger

## Step 5: Make user_id NOT NULL (After Backfill)

If you had existing products and assigned them to a user, now make the column required:

```sql
ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
```

## Step 6: Test Authentication

1. Visit http://localhost:3000/signup
2. Create a new account
3. Check Supabase Dashboard > Authentication > Users (should see new user)
4. Check users_metadata table (should have matching record)
5. Try logging out and logging back in
6. Visit /seller (should be protected, redirect to login if not authenticated)

## Troubleshooting

### Error: "relation users_metadata already exists"
- The migration was already run partially
- Check which parts completed successfully
- Run only the missing parts manually

### Error: "user_id column violates not null constraint"
- You have existing products without user_id
- Go back to Step 2 and handle existing products

### Error: "trigger on_auth_user_created already exists"
- Safe to ignore or use `DROP TRIGGER IF EXISTS` before recreating

### RLS Policies not working
- Ensure RLS is enabled: `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`
- Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'products';`

## Rollback

If something goes wrong:

1. Go to Supabase Dashboard > Database > Backups
2. Restore the backup you created in Step 1
3. Review the migration SQL for issues
4. Fix and try again

## Next Steps

After successful migration:
- Update seller dashboard to use AuthContext
- Add product limit enforcement
- Test multi-tenant isolation (users can't see each other's products)
- Proceed to Phase 2: Payments
