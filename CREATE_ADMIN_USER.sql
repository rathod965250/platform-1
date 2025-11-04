-- ============================================================
-- CREATE ADMIN USER IN DATABASE
-- ============================================================
-- This script creates an admin user in the database
-- ============================================================

-- Method 1: Create a new admin user (if you don't have an existing user)
-- Replace 'admin@example.com' and 'AdminPassword123!' with your desired credentials

-- Step 1: Create the auth user (run this in Supabase SQL Editor)
-- Note: You'll need to use Supabase Auth API or Dashboard to create the auth user
-- Then update the profile role below

-- Step 2: Update an existing user's role to admin
-- Replace 'user@example.com' with the email of the user you want to make admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Verify the admin was created
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE role = 'admin';

-- ============================================================
-- ALTERNATIVE: Create admin user via Supabase Dashboard
-- ============================================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" 
-- 3. Enter email: admin@example.com
-- 4. Enter password: YourSecurePassword123!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"
-- 7. Then run this SQL to update the profile:
--    UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- ============================================================
-- BULK: Make multiple users admin
-- ============================================================
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email IN ('admin1@example.com', 'admin2@example.com');

-- ============================================================
-- VERIFY ADMIN ACCESS
-- ============================================================
-- After creating admin, verify:
-- 1. Login with admin credentials at /login
-- 2. Should redirect to /admin (not /dashboard)
-- 3. Should see admin sidebar with all admin features

