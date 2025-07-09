# EMERGENCY FIX: Resolve Database and Authentication Issues

## The Root Problem
The error "infinite recursion detected in policy for relation 'profiles'" means the RLS policies are referencing themselves, creating a loop. This prevents any database operations on the profiles table.

## IMMEDIATE SOLUTION

### Step 1: Fix the RLS Policies
1. Go to your Supabase dashboard: https://ijspmapsslaorufibuua.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the content from `FIX_RLS_POLICIES.sql`
4. Click **RUN**

This will replace the problematic policies with non-recursive ones.

### Step 2: Create Super Admin User
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Fill in:
   - **Email**: admin@toru-orua.com
   - **Password**: SuperAdmin@2024
   - **Auto Confirm User**: ✅ Check this box
4. Click **Create user**
5. **Copy the User ID** that appears

### Step 3: Create Super Admin Profile
1. Go back to **SQL Editor**
2. First, get the user ID:
```sql
SELECT id FROM auth.users WHERE email = 'admin@toru-orua.com';
```
3. Copy the ID from the result
4. Run this query (replace USER_ID_HERE with the actual ID):
```sql
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

### Step 4: Test the Fix
1. Try registering a new user through your application
2. Try logging in with the super admin credentials
3. Check if the dashboard loads properly

## Alternative: Nuclear Option (If Above Doesn't Work)

If the RLS policies are still causing issues, temporarily disable them:

```sql
-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create the super admin profile
INSERT INTO profiles (
  user_id, 
  email, 
  full_name, 
  role,
  is_verified
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@toru-orua.com'),
  'admin@toru-orua.com',
  'Super Administrator',
  'super_admin',
  true
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## Verification Commands

Run these to verify everything is working:

```sql
-- Check if policies exist and are not recursive
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check super admin exists
SELECT 
  u.id, u.email, u.email_confirmed_at,
  p.full_name, p.role, p.is_verified
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@toru-orua.com';

-- Test profile access
SELECT COUNT(*) FROM profiles;
```

## What Each Step Does

1. **Fix RLS Policies**: Removes the circular reference that was causing infinite recursion
2. **Create Auth User**: Creates the authentication record in Supabase Auth
3. **Create Profile**: Creates the profile record with super_admin role
4. **Test**: Verifies everything works

## Expected Results

After completing these steps:
- ✅ No more "infinite recursion" errors
- ✅ Users can register successfully
- ✅ Super admin can log in
- ✅ Dashboard loads without errors
- ✅ Profile queries work normally

## If You Still Get Errors

1. **"permission denied"**: The RLS policies might still be problematic. Use the nuclear option above.

2. **"relation does not exist"**: The migration wasn't run properly. Re-run the entire migration.

3. **"duplicate key"**: The user/profile already exists. Check existing data first.

Let me know the results of each step!