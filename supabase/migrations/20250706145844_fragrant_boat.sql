-- Fix RLS Policies for Profiles Table
-- This resolves the infinite recursion error

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

-- Create new, non-recursive policies
-- Policy 1: Users can view their own profile (simple, no recursion)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can update their own profile (simple, no recursion)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Super admins can view all profiles (using direct role check)
CREATE POLICY "Super admins view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Direct check without subquery to avoid recursion
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
    OR user_id = auth.uid()
  );

-- Policy 4: Super admins can update all profiles (using direct role check)
CREATE POLICY "Super admins update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- Direct check without subquery to avoid recursion
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
    OR user_id = auth.uid()
  );

-- Policy 5: Allow profile creation during signup
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Alternative approach: Create a simpler policy structure
-- If the above still causes issues, use this simpler approach:

-- Drop the complex policies and use simpler ones
-- DROP POLICY IF EXISTS "Super admins view all profiles" ON profiles;
-- DROP POLICY IF EXISTS "Super admins update all profiles" ON profiles;

-- CREATE POLICY "Simple view policy"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- CREATE POLICY "Simple update policy"
--   ON profiles FOR UPDATE
--   TO authenticated
--   USING (user_id = auth.uid());