# 🔐 Create Admin Credentials Guide

This guide shows you **3 easy methods** to create an admin user in your database.

---

## ✅ Method 1: Using Supabase Dashboard (EASIEST - Recommended)

### Steps:

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Or your project URL

2. **Create Authentication User:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Users"** tab
   - Click **"Add user"** button (top right)

3. **Fill in the form:**
   ```
   Email: admin@example.com
   Password: YourSecurePassword123!
   ```
   - ✅ **IMPORTANT**: Check **"Auto Confirm User"** (so you can login immediately)
   - Click **"Create user"**

4. **Update Profile Role to Admin:**
   - Go to **"SQL Editor"** in the sidebar
   - Click **"New query"**
   - Paste and run this SQL:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

5. **Verify:**
   ```sql
   SELECT id, email, full_name, role, created_at
   FROM profiles
   WHERE email = 'admin@example.com';
   ```
   - Should show `role: admin`

6. **Test Login:**
   - Go to: http://localhost:3000/login
   - Email: `admin@example.com`
   - Password: `YourSecurePassword123!`
   - Should redirect to `/admin` (admin dashboard)

---

## ✅ Method 2: Sign Up Then Update Role

### Steps:

1. **Create a Regular User:**
   - Go to: http://localhost:3000/signup
   - Fill in the signup form:
     ```
     Full Name: Admin User
     Email: admin@example.com
     Password: YourSecurePassword123!
     Confirm Password: YourSecurePassword123!
     ```
   - Click **"Sign up"**

2. **Update Role to Admin:**
   - Go to Supabase Dashboard > **SQL Editor**
   - Run this SQL:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

3. **Login and Verify:**
   - Go to: http://localhost:3000/login
   - Login with admin credentials
   - Should redirect to `/admin`

---

## ✅ Method 3: Direct SQL (For Advanced Users)

### Steps:

1. **First, create the auth user via Supabase Dashboard** (Method 1, steps 1-3)

2. **Then run this SQL in SQL Editor:**
   ```sql
   -- Update the profile role to admin
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   
   -- Verify
   SELECT id, email, full_name, role, created_at
   FROM profiles
   WHERE role = 'admin';
   ```

---

## 🔍 Verify Admin Status

After creating admin, verify it works:

### 1. Check Database:
```sql
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE role = 'admin';
```

### 2. Test Login:
- Go to: http://localhost:3000/login
- Login with admin email/password
- Should redirect to `/admin` (not `/dashboard`)

### 3. Check Admin Access:
- Should see admin sidebar
- Should have access to:
  - `/admin` - Admin dashboard
  - `/admin/tests` - Manage tests
  - `/admin/questions` - Manage questions
  - `/admin/assignments` - Manage assignments
  - `/admin/users` - Manage users
  - `/admin/categories` - Manage categories

---

## 🚨 Troubleshooting

### Issue: Login redirects to `/dashboard` instead of `/admin`

**Solution:**
1. Verify the profile role is actually `admin`:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'admin@example.com';
   ```
2. If role is `student`, update it:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
   ```
3. Clear browser cache and cookies
4. Logout and login again

### Issue: "Access Denied" when trying to access `/admin`

**Solution:**
1. Check if profile exists:
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@example.com';
   ```
2. If profile doesn't exist, the trigger might not have fired. Create it manually:
   ```sql
   INSERT INTO profiles (id, email, role)
   SELECT id, email, 'admin'
   FROM auth.users
   WHERE email = 'admin@example.com';
   ```

### Issue: Profile doesn't exist after creating auth user

**Solution:**
1. Check if there's a trigger that auto-creates profiles
2. If not, manually create the profile:
   ```sql
   INSERT INTO profiles (id, email, role)
   SELECT id, email, 'admin'
   FROM auth.users
   WHERE email = 'admin@example.com';
   ```

---

## 📝 Quick Reference

**Admin Email:** `admin@example.com`  
**Admin Password:** `YourSecurePassword123!`  
**Update Role SQL:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

**Verify Admin:**
```sql
SELECT email, role FROM profiles WHERE email = 'admin@example.com';
```

---

## 🎯 Next Steps

Once admin is created:

1. ✅ Login at `/login`
2. ✅ Access admin dashboard at `/admin`
3. ✅ Start managing tests, questions, and assignments
4. ✅ Allocate assignments to students from `/admin/assignments`

---

**Need help?** Check the Supabase documentation or run the verification queries above.

