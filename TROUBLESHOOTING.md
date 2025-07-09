# Database Error Troubleshooting Guide

## Issue: Database Error Creating New User

This error typically occurs when:
1. The database migration hasn't been run yet
2. There's a conflict with existing data
3. The trigger function has issues

## Step-by-Step Solution

### Step 1: Check if Migration Was Run
1. Go to your Supabase dashboard: https://ijspmapsslaorufibuua.supabase.co
2. Navigate to **Table Editor**
3. Check if these tables exist:
   - `profiles`
   - `hero_slides`
   - `activities`
   - `elections`
   - `candidates`
   - `votes`

If these tables don't exist, the migration wasn't run properly.

### Step 2: Run Migration Manually
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the ENTIRE content from `supabase/migrations/20250706142034_soft_cell.sql`
3. Paste it into the SQL Editor
4. Click **Run**

### Step 3: Check for Trigger Issues
If the migration ran but user creation still fails, the trigger might have issues. Run this query to check:

```sql
-- Check if the trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_super_admin_profile';

-- Check if the function exists
SELECT * FROM information_schema.routines 
WHERE routine_name = 'create_super_admin_profile';
```

### Step 4: Alternative - Create Super Admin Without Trigger
If the trigger is causing issues, create the super admin manually:

1. **First, create the user in Authentication:**
   - Go to **Authentication** → **Users**
   - Click **Add user**
   - Email: `admin@toru-orua.com`
   - Password: `SuperAdmin@2024`
   - Check **Auto Confirm User**
   - Click **Create user**

2. **Then, create the profile manually:**
   ```sql
   -- Get the user ID first
   SELECT id, email FROM auth.users WHERE email = 'admin@toru-orua.com';
   
   -- Insert the profile (replace USER_ID with the actual ID from above)
   INSERT INTO profiles (
     user_id, 
     email, 
     full_name, 
     role,
     is_verified
   ) VALUES (
     'USER_ID_HERE',  -- Replace with actual user ID
     'admin@toru-orua.com',
     'Super Administrator',
     'super_admin',
     true
   );
   ```

### Step 5: Disable Problematic Trigger (If Needed)
If the trigger is causing issues, you can disable it temporarily:

```sql
-- Disable the trigger
DROP TRIGGER IF EXISTS trigger_create_super_admin_profile ON auth.users;

-- Drop the function if needed
DROP FUNCTION IF EXISTS create_super_admin_profile();
```

### Step 6: Verify Setup
After creating the super admin:

1. **Check the profile exists:**
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@toru-orua.com';
   ```

2. **Test login:**
   - Go to your application
   - Try logging in with:
     - Email: admin@toru-orua.com
     - Password: SuperAdmin@2024

## Common Error Messages and Solutions

### "relation 'profiles' does not exist"
- **Solution**: Run the database migration first

### "function create_super_admin_profile() does not exist"
- **Solution**: The migration didn't run completely. Re-run the entire migration.

### "duplicate key value violates unique constraint"
- **Solution**: The user or profile already exists. Check existing data:
  ```sql
  SELECT * FROM auth.users WHERE email = 'admin@toru-orua.com';
  SELECT * FROM profiles WHERE email = 'admin@toru-orua.com';
  ```

### "permission denied for table profiles"
- **Solution**: RLS policies might be blocking the insert. Temporarily disable RLS:
  ```sql
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  -- Create the profile
  -- Then re-enable RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ```

## Quick Fix Script
If you want to start fresh, run this script to clean up and recreate everything:

```sql
-- Clean up existing data (CAUTION: This deletes everything)
DROP TRIGGER IF EXISTS trigger_create_super_admin_profile ON auth.users;
DROP FUNCTION IF EXISTS create_super_admin_profile();
DELETE FROM profiles WHERE email = 'admin@toru-orua.com';

-- Then re-run the entire migration from the file
```

## Contact for Help
If you're still having issues:
1. Check the exact error message in Supabase logs
2. Go to **Logs** in your Supabase dashboard
3. Look for recent errors
4. Share the specific error message for more targeted help