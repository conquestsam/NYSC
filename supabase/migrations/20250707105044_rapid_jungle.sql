/*
# Fix RLS Infinite Recursion in Profiles Table

This migration resolves the infinite recursion error in the profiles table RLS policies.

## Problem
The existing policies were creating circular references when checking user roles,
causing infinite recursion when querying the profiles table.

## Solution
1. Drop all existing problematic policies
2. Create simplified, non-recursive policies
3. Use a function-based approach for role checking to avoid recursion

## Changes
- Remove all existing RLS policies on profiles table
- Create new policies that avoid self-referential queries
- Implement proper role-based access control without recursion
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

-- Create a security definer function to check user role without recursion
CREATE OR REPLACE FUNCTION auth.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth.get_user_role(uuid) TO authenticated;

-- Create new, simplified RLS policies

-- Policy 1: Users can view their own profile
CREATE POLICY "users_select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Users can insert their own profile (for signup)
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Super admins can view all profiles (using the function to avoid recursion)
CREATE POLICY "super_admins_select_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR auth.get_user_role(auth.uid()) = 'super_admin'
  );

-- Policy 5: Super admins can update all profiles (using the function to avoid recursion)
CREATE POLICY "super_admins_update_all_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR auth.get_user_role(auth.uid()) = 'super_admin'
  );

-- Policy 6: Super admins can delete profiles
CREATE POLICY "super_admins_delete_profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.get_user_role(auth.uid()) = 'super_admin');