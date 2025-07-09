-- Fix RLS Policies for Profiles Table (Corrected Version)
-- This resolves the infinite recursion error without requiring auth schema access

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "super_admins_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "super_admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "super_admins_delete_profiles" ON profiles;

-- Drop the function if it exists (this might fail if it doesn't exist, which is fine)
DROP FUNCTION IF EXISTS auth.get_user_role(uuid);

-- Create a simple, non-recursive approach using a view
-- First, create a view that can safely check roles
CREATE OR REPLACE VIEW user_roles AS
SELECT user_id, role 
FROM profiles;

-- Grant access to the view
GRANT SELECT ON user_roles TO authenticated;

-- Create new, simplified RLS policies that avoid recursion

-- Policy 1: Users can always view their own profile
CREATE POLICY "users_view_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can always update their own profile  
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Users can insert their own profile during signup
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Allow super admins to view all profiles
-- We'll use a simpler approach that checks if the current user has super_admin role
CREATE POLICY "super_admins_view_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 5: Allow super admins to update all profiles
CREATE POLICY "super_admins_update_all"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 6: Allow super admins to delete profiles
CREATE POLICY "super_admins_delete_all"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Alternative: If the above still causes issues, use this simpler approach
-- Uncomment these and comment out the above policies if needed

-- CREATE POLICY "simple_select_policy"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- CREATE POLICY "simple_insert_policy"
--   ON profiles FOR INSERT
--   TO authenticated
--   WITH CHECK (user_id = auth.uid());

-- CREATE POLICY "simple_update_policy"
--   ON profiles FOR UPDATE
--   TO authenticated
--   USING (user_id = auth.uid());

-- CREATE POLICY "simple_delete_policy"
--   ON profiles FOR DELETE
--   TO authenticated
--   USING (user_id = auth.uid());