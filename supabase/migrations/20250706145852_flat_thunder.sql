-- Create Super Admin User and Profile
-- Run this after fixing the RLS policies

-- Step 1: Check if super admin user exists in auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@toru-orua.com';

-- Step 2: If the user doesn't exist, you need to create it in the Authentication UI first
-- Go to Authentication > Users > Add user
-- Email: admin@toru-orua.com
-- Password: SuperAdmin@2024
-- Check "Auto Confirm User"

-- Step 3: After creating the user, get the user ID and create the profile
-- Replace 'USER_ID_HERE' with the actual user ID from the auth.users table

-- First, get the user ID:
SELECT id FROM auth.users WHERE email = 'admin@toru-orua.com';

-- Then create the profile (replace USER_ID_HERE with actual ID):
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

-- Step 4: Verify the setup
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

-- Step 5: If you still get permission errors, temporarily disable RLS
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- -- Run the INSERT statement above
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;