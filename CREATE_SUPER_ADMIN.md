# Create Super Admin - Step by Step Guide

## The Issue
All database tables exist, but the super admin user hasn't been created yet. We need to create both the authentication user and the profile record.

## Step-by-Step Solution

### Step 1: Create the Authentication User
1. Go to your Supabase dashboard: https://ijspmapsslaorufibuua.supabase.co
2. Navigate to **Authentication** → **Users**
3. Click **Add user** button
4. Fill in the form:
   - **Email**: `admin@toru-orua.com`
   - **Password**: `SuperAdmin@2024`
   - **Auto Confirm User**: ✅ (Check this box)
5. Click **Create user**
6. **IMPORTANT**: Copy the User ID that appears (it looks like: `12345678-1234-1234-1234-123456789abc`)

### Step 2: Create the Profile Record
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste this SQL query:

```sql
-- First, let's check if the user was created successfully
SELECT id, email, email_confirmed_at FROM auth.users 
WHERE email = 'admin@toru-orua.com';
```

3. Run the query to get the user ID
4. Copy the `id` value from the result
5. Now run this query (replace `USER_ID_HERE` with the actual ID):

```sql
INSERT INTO profiles (
  user_id, 
  email, 
  full_name, 
  role,
  is_verified
) VALUES (
  'USER_ID_HERE',  -- Replace with the actual user ID from step above
  'admin@toru-orua.com',
  'Super Administrator',
  'super_admin',
  true
);
```

### Step 3: Verify the Setup
Run this verification query:

```sql
-- Verify both user and profile exist
SELECT 
  u.id as user_id,
  u.email as auth_email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.is_verified
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@toru-orua.com';
```

**Expected Result**: You should see one row with:
- `user_id`: A UUID
- `auth_email`: admin@toru-orua.com
- `email_confirmed_at`: A timestamp (not null)
- `profile_id`: A UUID
- `full_name`: Super Administrator
- `role`: super_admin
- `is_verified`: true

### Step 4: Test Login
1. Go to your application at the sign-in page
2. Enter credentials:
   - **Email**: `admin@toru-orua.com`
   - **Password**: `SuperAdmin@2024`
3. Click **Sign In**

**Expected Result**: You should be redirected to the dashboard.

## Troubleshooting

### If Step 1 Fails (Can't create user):
- Check if the user already exists:
```sql
SELECT * FROM auth.users WHERE email = 'admin@toru-orua.com';
```
- If it exists, skip to Step 2

### If Step 2 Fails (Can't create profile):
**Error: "duplicate key value violates unique constraint"**
- The profile already exists. Check with:
```sql
SELECT * FROM profiles WHERE email = 'admin@toru-orua.com';
```

**Error: "permission denied for table profiles"**
- Temporarily disable RLS:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Run the INSERT statement
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### If Login Still Fails:
1. **Check if email is confirmed**:
```sql
SELECT email, email_confirmed_at FROM auth.users 
WHERE email = 'admin@toru-orua.com';
```

2. **If email_confirmed_at is null, confirm it manually**:
```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'admin@toru-orua.com';
```

## Quick Fix Script (If You Want to Start Fresh)
If something went wrong and you want to start over:

```sql
-- Clean up (CAUTION: This deletes the existing data)
DELETE FROM profiles WHERE email = 'admin@toru-orua.com';
-- Note: You'll need to delete the auth user from the Authentication UI

-- Then follow Steps 1-2 again
```

## What to Report Back:
1. ✅ User created successfully in Authentication panel
2. ✅ User ID copied: `[paste the ID here]`
3. ✅ Profile created successfully with SQL
4. ✅ Verification query shows complete data
5. ✅ Login works

Let me know which step you complete and if you encounter any errors!