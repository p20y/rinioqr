# Database Setup

## Quick Start

**Use this file:** `complete_setup.sql`

This is the **ONLY** file you need to run. It contains everything.

## Instructions

### Option 1: Fresh Start (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New query**
4. Copy **ALL** content from `complete_setup.sql`
5. Paste into SQL Editor
6. Click **RUN**
7. Wait for success message: "✅ Database setup complete!"
8. Done! Go test your app.

### Option 2: Clean Database First

If you want to completely reset the database:

1. Open `complete_setup.sql`
2. **Uncomment** lines 11-15 (the DROP TABLE lines)
3. Run the SQL
4. This will delete all existing data and recreate everything fresh

## What This Sets Up

✅ **Subscription Plans Table** - 4 pricing tiers (Free, Starter, Pro, Enterprise)
✅ **User Metadata Table** - Stores subscription status, product limits, usage stats
✅ **Products Table** - Multi-tenant with user_id, secure RLS policies
✅ **Auto-create User Metadata** - Trigger creates metadata when users sign up
✅ **Auto-update Product Count** - Trigger tracks product additions/deletions
✅ **Helper Functions** - Check product limits, update timestamps
✅ **RLS Policies** - Secure multi-tenant data isolation
✅ **Backfill** - Fixes any existing users without metadata

## After Running

Test the setup:
1. Go to http://localhost:3000/signup
2. Sign up with email or Google
3. Should redirect to `/seller` dashboard
4. You'll see "Free Plan - Products: 0 / 3"
5. Add a product - should work!
6. Try adding 4 products - should hit limit

## Troubleshooting

**Error: "relation already exists"**
- Uncomment the DROP TABLE lines at the top
- Run again to reset everything

**Error: "permission denied"**
- Make sure you're using the Supabase SQL Editor
- Don't use the Table Editor for this

**Still getting "Database error saving new user"**
- The trigger isn't active
- Check the verification output at the end
- Should say "✅ User creation trigger active"

## Old Files

The other SQL files in this folder are old/deprecated:
- `supabase_complete_setup.sql` - Old version
- `supabase_migration.sql` - Old version
- `supabase_migration_complete.sql` - Old version
- `update_image_urls.sql` - Old one-off script

**Only use `complete_setup.sql`** - it's the latest and most complete.
