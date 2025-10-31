-- ============================================================
-- Create Test User Account
-- ============================================================
-- Run this in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/rscxnpoffeedqfgynnct

-- Step 1: Create the auth user
-- Note: You need to create the user via Supabase Dashboard > Authentication > Users
-- Click "Add user" and use:
-- Email: test@example.com
-- Password: your-test-password
-- Auto Confirm User: YES (check this box)

-- Step 2: After creating the user in the dashboard, run this to verify and update profile
-- Replace 'USER_ID_HERE' with the actual UUID from the auth.users table

-- First, let's check if the user exists and get their ID
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'test@example.com';

-- Step 3: Verify the profile was auto-created by the trigger
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE email = 'test@example.com';

-- Step 4: If profile exists but needs updating, run this:
UPDATE profiles 
SET 
    full_name = 'Test User',
    role = 'student'
WHERE email = 'test@example.com';

-- Step 5: Verify the update
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE email = 'test@example.com';

-- ============================================================
-- Alternative: Create Admin User
-- ============================================================
-- If you want to make this user an admin instead:
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE email = 'test@example.com';
