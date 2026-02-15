# Database Error Troubleshooting Guide

## Error: "Database error saving new user"

This error occurs when a user signs up but the `users_metadata` table doesn't exist or the trigger isn't working properly.

---

## Solution: Run the Database Migration

### Step 1: Check if Migration Has Been Run

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Rinio QR project
3. Click **"Table Editor"** in the left sidebar
4. Look for these tables:
   - `users_metadata` ❌ If missing, migration hasn't been run
   - `subscription_plans` ❌ If missing, migration hasn't been run
   - `products` ✓ Should exist (from earlier setup)

### Step 2: Run the Migration SQL

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the ENTIRE contents of `supabase/migrations/001_auth_multitenancy.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Were Created

After running the migration, verify:

1. **Check Tables:**
   - Go to **Table Editor**
   - You should see:
     - ✅ `users_metadata`
     - ✅ `subscription_plans`
     - ✅ `products` (now with `user_id` column)

2. **Check Subscription Plans:**
   ```sql
   SELECT * FROM subscription_plans;
   ```
   Should return 4 rows:
   - Free (3 products)
   - Starter (15 products)
   - Pro (100 products)
   - Enterprise (999999 products)

3. **Check Triggers:**
   ```sql
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE event_object_schema = 'public';
   ```
   Should show:
   - `on_auth_user_created` on `auth.users`
   - `product_count_trigger` on `products`

### Step 4: Handle Existing Data

**If you have existing products in the database:**

⚠️ **IMPORTANT**: The `products` table now requires a `user_id` column. Existing products without a `user_id` will cause errors.

**Option A: You have NO existing products** (recommended)
- Skip to Step 5 - you're done!

**Option B: You have existing test products**
1. Delete all existing products:
   ```sql
   DELETE FROM products;
   ```

**Option C: You want to keep existing products**
1. First, create a test user account through the signup page
2. Get the user's ID from Supabase:
   - Go to **Authentication** → **Users**
   - Copy the User UID
3. Assign existing products to this user:
   ```sql
   UPDATE products
   SET user_id = 'YOUR_USER_ID_HERE'
   WHERE user_id IS NULL;
   ```
4. Make user_id required:
   ```sql
   ALTER TABLE products ALTER COLUMN user_id SET NOT NULL;
   ```

### Step 5: Test User Creation

1. **Clear browser cache and cookies** (important!)
2. Go to your app: `http://localhost:3000/signup`
3. Try signing up with a new email
4. You should be successfully redirected to `/seller`

5. **Verify in Supabase:**
   - Go to **Authentication** → **Users**
   - You should see your new user
   - Go to **Table Editor** → `users_metadata`
   - You should see a row with:
     - `id` = your user ID
     - `email` = your email
     - `subscription_status` = 'free'
     - `product_limit` = 3
     - `current_product_count` = 0

---

## Common Errors and Solutions

### Error: "relation 'users_metadata' does not exist"
**Cause**: Migration hasn't been run
**Solution**: Follow Step 2 above to run the migration

### Error: "null value in column 'user_id' violates not-null constraint"
**Cause**: Trying to create products but user_id is missing
**Solution**:
1. Check that AuthContext is properly wrapping your app
2. Verify user is logged in before creating products
3. Make sure the seller page is checking for `user.id` before inserting

### Error: "insert or update on table 'products' violates foreign key constraint"
**Cause**: Trying to assign a user_id that doesn't exist in auth.users
**Solution**: Only use user IDs from the Authentication → Users table

### Error: "trigger 'on_auth_user_created' does not exist"
**Cause**: Migration didn't complete fully
**Solution**:
1. Drop the partial trigger: `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
2. Re-run the migration

### Error: Google OAuth works but user metadata isn't created
**Cause**: Trigger might not be firing for OAuth users
**Solution**:
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Manually create metadata for OAuth user:
   ```sql
   INSERT INTO users_metadata (id, email, subscription_status, product_limit)
   VALUES ('USER_ID_HERE', 'email@example.com', 'free', 3);
   ```

---

## Verification Checklist

After fixing, verify everything works:

- [ ] ✅ Tables exist: `users_metadata`, `subscription_plans`, `products`
- [ ] ✅ Subscription plans seeded (4 rows)
- [ ] ✅ Triggers exist: `on_auth_user_created`, `product_count_trigger`
- [ ] ✅ Can sign up with email/password
- [ ] ✅ User metadata automatically created on signup
- [ ] ✅ Can sign in with Google OAuth
- [ ] ✅ User metadata created for OAuth users
- [ ] ✅ Can add products as authenticated user
- [ ] ✅ Product count increments in `users_metadata`
- [ ] ✅ Can delete products
- [ ] ✅ Product count decrements in `users_metadata`
- [ ] ✅ Product limit enforced (can't add 4th product as free user)

---

## Quick Debug Queries

Run these to check the current state:

```sql
-- Check if migration tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users_metadata', 'subscription_plans');

-- Check products table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products';

-- Check if any users exist
SELECT COUNT(*) as user_count FROM auth.users;

-- Check if any user metadata exists
SELECT COUNT(*) as metadata_count FROM users_metadata;

-- Check for orphaned users (users without metadata)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN users_metadata um ON u.id = um.id
WHERE um.id IS NULL;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users_metadata', 'subscription_plans', 'products');
```

---

## Still Having Issues?

If you're still experiencing errors:

1. **Check the browser console** (F12 → Console tab) for client-side errors
2. **Check Supabase logs**: Dashboard → Logs → API Logs
3. **Check the specific error message** and search this document
4. **Verify environment variables** in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` is correct
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

5. **Try in incognito/private mode** to rule out caching issues

6. **Restart your dev server**:
   ```bash
   # Kill existing server
   lsof -ti:3000 | xargs kill -9

   # Start fresh
   npm run dev
   ```
