-- Script to create an admin user
-- Run this in Supabase SQL Editor after creating a user via the signup page

-- First, create a user via the signup page or Supabase dashboard
-- Then run this script with the user's ID

-- Example: Update user role to admin
-- Replace 'USER_EMAIL_HERE' with the actual email

UPDATE profiles 
SET role = 'admin'
WHERE email = 'USER_EMAIL_HERE';

-- Verify the update
SELECT id, email, role, full_name, created_at 
FROM profiles 
WHERE email = 'USER_EMAIL_HERE';

-- Alternative: If you know the user ID
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE id = 'USER_ID_HERE';
