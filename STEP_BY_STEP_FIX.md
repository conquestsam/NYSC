# URGENT: Fix Database and Authentication Issues

## The Problem
The error "Invalid login credentials" means the super admin user doesn't exist yet. The database error when creating users suggests the migration hasn't been run properly.

## IMMEDIATE SOLUTION - Follow These Steps Exactly:

### Step 1: Run the Database Migration
1. Go to your Supabase dashboard: https://ijspmapsslaorufibuua.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Open the file `supabase/migrations/20250706142034_soft_cell.sql` from this project
4. Copy the ENTIRE content (all 400+ lines)
5. Paste it into the SQL Editor
6. Click **RUN** button

**Expected Result**: You should see "Success. No rows returned" or similar success message.

### Step 2: Verify Tables Were Created
1. Go to **Table Editor** in the left sidebar
2. You should now see these tables:
   - profiles
   - hero_slides
   - activities
   - elections
   - candidates
   - votes
   - job_scholarships
   - about_sections
   - photo_gallery
   - suggestions
   - suggestion_reactions

### Step 3: Create Super Admin User Manually
Since the trigger might not work initially, let's create the super admin manually:

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add user**
3. Fill in:
   - **Email**: admin@toru-orua.com
   - **Password**: SuperAdmin@2024
   - **Check the box**: "Auto Confirm User"
4. Click **Create user**
5. **Copy the User ID** that appears (it looks like: 12345678-1234-1234-1234-123456789abc)

### Step 4: Create Super Admin Profile
1. Go back to **SQL Editor**
2. Run this query (replace USER_ID_HERE with the actual user ID from step 3):

```sql
INSERT INTO profiles (
  user_id, 
  email, 
  full_name, 
  role,
  is_verified
) VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID from step 3
  'admin@toru-orua.com',
  'Super Administrator',
  'super_admin',
  true
);
```

### Step 5: Test Login
1. Go to your application
2. Navigate to the sign-in page
3. Try logging in with:
   - **Email**: admin@toru-orua.com
   - **Password**: SuperAdmin@2024

## If You Still Get Errors:

### Error: "relation 'profiles' does not exist"
- The migration didn't run. Go back to Step 1.

### Error: "duplicate key value violates unique constraint"
- The user already exists. Check existing users:
```sql
SELECT * FROM auth.users WHERE email = 'admin@toru-orua.com';
SELECT * FROM profiles WHERE email = 'admin@toru-orua.com';
```

### Error: "permission denied"
- Temporarily disable RLS, create the profile, then re-enable:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Run the INSERT statement from Step 4
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## Quick Verification Commands
Run these in SQL Editor to verify everything is working:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if super admin exists
SELECT u.id, u.email, p.full_name, p.role 
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@toru-orua.com';
```

## What to Tell Me Next:
1. Did the migration run successfully? (Step 1)
2. Do you see all the tables? (Step 2)
3. Were you able to create the user? (Step 3)
4. What was the User ID? (Step 3)
5. Did the profile creation work? (Step 4)
6. Can you log in now? (Step 5)

Let me know which step you get stuck on and I'll help you troubleshoot further!