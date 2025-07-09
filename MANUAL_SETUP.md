# NYSC Toru-Orua Portal - Manual Setup Guide

## Prerequisites
- Supabase account and project created
- Project URL: https://ijspmapsslaorufibuua.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc3BtYXBzc2xhb3J1ZmlidXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTIyNzIsImV4cCI6MjA2NzM4ODI3Mn0.zZwgpLnUCYot_saoKoT-po9w8eyMsbG4B9rbv8LvyY4

## Super Admin Credentials
- **Email**: admin@toru-orua.com
- **Password**: SuperAdmin@2024

## Database Setup

### 1. Run Database Migrations
1. Go to your Supabase dashboard at https://ijspmapsslaorufibuua.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the entire content from `supabase/migrations/20250706142034_soft_cell.sql`
4. Run the query to create all tables, types, and policies

### 2. Create Super Admin Account
1. Go to the Authentication section in Supabase
2. Create a new user with email: admin@toru-orua.com
3. Set a secure password: SuperAdmin@2024
4. The trigger will automatically create the super admin profile

## Supabase Storage Setup

### 1. Create Storage Buckets
1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `hero-images` (for hero slider images)
   - `profile-photos` (for user profile photos)
   - `activity-images` (for activity and CDS project images)
   - `gallery-images` (for photo gallery)
   - `job-images` (for job/scholarship images)

### 2. Set Storage Policies
For each bucket, you'll need to set appropriate RLS policies:

#### Hero Images Bucket
```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'hero-images');

-- Allow super admins to insert/update/delete
CREATE POLICY "Super Admin Access" ON storage.objects
FOR ALL USING (
  bucket_id = 'hero-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
```

#### Profile Photos Bucket
```sql
-- Allow users to read all profile photos
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow users to upload their own profile photos
CREATE POLICY "User Upload Access" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile photos
CREATE POLICY "User Update Access" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Activity Images Bucket
```sql
-- Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'activity-images');

-- Allow super admins to manage all files
CREATE POLICY "Super Admin Access" ON storage.objects
FOR ALL USING (
  bucket_id = 'activity-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
```

#### Gallery Images Bucket
```sql
-- Allow authenticated users to read
CREATE POLICY "Authenticated Read Access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gallery-images' AND
  auth.role() = 'authenticated'
);

-- Allow super admins to manage all files
CREATE POLICY "Super Admin Access" ON storage.objects
FOR ALL USING (
  bucket_id = 'gallery-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
```

#### Job Images Bucket
```sql
-- Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'job-images');

-- Allow super admins to manage all files
CREATE POLICY "Super Admin Access" ON storage.objects
FOR ALL USING (
  bucket_id = 'job-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
```

## File Upload Guidelines

### 1. Image Naming Convention
- Use descriptive names with timestamps
- Format: `{category}_{timestamp}_{description}.{ext}`
- Example: `hero_20240101_new_year.jpg`

### 2. File Size Limits
- Hero images: Max 5MB
- Profile photos: Max 2MB
- Activity images: Max 5MB
- Gallery images: Max 10MB

### 3. Supported Formats
- Images: JPG, PNG, WebP
- Documents: PDF (for manifestos)

## Environment Variables Setup

Update your `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ijspmapsslaorufibuua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc3BtYXBzc2xhb3J1ZmlidXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTIyNzIsImV4cCI6MjA2NzM4ODI3Mn0.zZwgpLnUCYot_saoKoT-po9w8eyMsbG4B9rbv8LvyY4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPER_ADMIN_EMAIL=admin@toru-orua.com
SUPER_ADMIN_PASSWORD=SuperAdmin@2024
```

## Initial Data Population

### 1. Hero Slides
After setting up storage, upload some hero images and create entries:
```sql
INSERT INTO hero_slides (title, description, image_url, display_order) VALUES
('Welcome to NYSC Toru-Orua', 'Serving the Nation, Building the Future', 'https://ijspmapsslaorufibuua.supabase.co/storage/v1/object/public/hero-images/hero1.jpg', 1),
('Community Development', 'Making a difference in our community', 'https://ijspmapsslaorufibuua.supabase.co/storage/v1/object/public/hero-images/hero2.jpg', 2);
```

### 2. Sample Activities
```sql
INSERT INTO activities (title, description, category, status, activity_date) VALUES
('Monthly CDS Meeting', 'Monthly coordination meeting for all CDS activities', 'cds', 'upcoming', '2024-02-15'),
('Health Outreach Program', 'Free medical checkup for community members', 'cds', 'past', '2024-01-20'),
('POP Preparation', 'Preparation activities for Passing Out Parade', 'pop', 'ongoing', '2024-02-10');
```

### 3. About Sections
```sql
INSERT INTO about_sections (section_type, title, description, display_order) VALUES
('lgi', 'Local Government Information', 'Toru-Orua is located in Sagbama Local Government Area of Bayelsa State...', 1),
('current_officials', 'CDS President', 'John Doe - Leading our community service efforts', 1),
('past_achievements', 'Community Impact', 'Over 50 successful projects completed in the past year', 1);
```

## Testing the Application

### 1. Basic Functionality Test
1. Visit the application homepage
2. Test user registration and login
3. Verify dashboard access
4. Test navigation between pages

### 2. Admin Features Test
1. Log in with super admin credentials
2. Access admin panel
3. Test CRUD operations for content
4. Verify file upload functionality

### 3. Security Test
1. Test RLS policies by accessing restricted content
2. Verify role-based access control
3. Test election voting restrictions

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Storage buckets created with proper policies
- [ ] Super admin account created
- [ ] Environment variables configured
- [ ] Initial data populated
- [ ] Application tested thoroughly
- [ ] SSL certificate configured (if custom domain)
- [ ] Backup strategy implemented

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check if the super admin account is created correctly
2. **Storage Access Denied**: Verify RLS policies are set correctly
3. **Database Connection**: Ensure environment variables are correct
4. **File Upload Issues**: Check bucket policies and file size limits

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Verify database policies in the SQL editor
4. Check network requests in developer tools

## Next Steps

After setup:
1. Customize the branding and colors
2. Add more content and images
3. Configure email templates in Supabase
4. Set up monitoring and analytics
5. Train administrators on content management

## Security Recommendations

1. Enable email confirmation for new users
2. Set up proper backup procedures
3. Monitor user activity logs
4. Regular security audits
5. Keep dependencies updated
6. Use strong passwords for all accounts
7. Enable two-factor authentication where possible