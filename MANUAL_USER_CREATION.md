# 🎯 Create Test User - Manual Steps

The automated script encountered an email validation issue. Here's the **easiest manual method**:

## ✅ Method 1: Use the Signup Page (EASIEST)

### Steps (Takes 30 seconds):

1. **Open your browser** to: http://localhost:3000/signup

2. **Fill in the form:**
   ```
   Full Name: Test User
   Email: test@example.com
   Password: your-test-password
   Confirm Password: your-test-password
   ```

3. **Click "Sign up"**

4. **Check browser console (F12)** for logs

5. **If successful:**
   - You'll see: "Account created successfully!"
   - Redirected to login page

6. **Login:**
   - Go to: http://localhost:3000/login
   - Email: test@example.com
   - Password: your-test-password
   - Click "Log in"

**That's it!** The user is created in the database automatically.

---

## ✅ Method 2: Supabase Dashboard

If the signup page doesn't work, use the dashboard:

### Steps:

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/rscxnpoffeedqfgynnct

2. **Navigate to Authentication:**
   - Click **Authentication** in left sidebar
   - Click **Users** tab

3. **Add User:**
   - Click **"Add user"** button (top right)

4. **Fill in the form:**
   ```
   Email: test@example.com
   Password: your-test-password
   ```

5. **IMPORTANT - Check this box:**
   - ✅ **Auto Confirm User**
   
   This skips email confirmation so you can login immediately.

6. **Click "Create user"**

7. **Verify Profile:**
   - Go to **Database** > **Table Editor**
   - Select **profiles** table
   - Look for email: test@example.com
   - Should see role: student

8. **If profile is missing, create it:**
   - Go to **SQL Editor**
   - Run this SQL:
   ```sql
   -- Get the user ID first
   SELECT id, email FROM auth.users WHERE email = 'test@example.com';
   
   -- Then insert profile (replace USER_ID with the actual ID from above)
   INSERT INTO profiles (id, email, full_name, role)
   VALUES ('USER_ID_HERE', 'test@example.com', 'Test User', 'student')
   ON CONFLICT (id) DO UPDATE 
   SET full_name = 'Test User';
   ```

---

## 🔑 Login Credentials

```
Email: test@example.com
Password: your-test-password
```

**Login URL:** http://localhost:3000/login

---

## ✅ Verify It Works

1. Go to: http://localhost:3000/login
2. Enter credentials above
3. Open browser console (F12)
4. Click "Log in"
5. Watch for these logs:
   ```
   🔐 Starting login process...
   📧 Email: test@example.com
   🚀 Attempting login...
   ✅ Login successful!
   ```
6. Should redirect to /dashboard

---

## 🐛 Common Issues

### "Email not confirmed"
**Fix:** In Supabase Dashboard:
1. Authentication > Users
2. Click on test@example.com
3. Click "Confirm email"

OR disable email confirmation:
1. Settings > Authentication
2. Toggle OFF "Enable email confirmations"

### "Invalid login credentials"
**Possible causes:**
- User not created yet
- Wrong password (must be exactly: your-test-password)
- Email not confirmed (see fix above)

### Profile not created
**Fix:** Run this SQL in Supabase SQL Editor:
```sql
-- First get the user ID
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Then create profile (replace USER_ID)
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Test User', 'student'
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO NOTHING;
```

---

## 📊 What Gets Created

When you create the user, you get:

**In auth.users table:**
- ✅ User account
- ✅ Email: test@example.com
- ✅ Password: (hashed)
- ✅ Confirmed: true

**In profiles table:**
- ✅ Profile record
- ✅ Email: test@example.com
- ✅ Full Name: Test User
- ✅ Role: student

---

## 🎉 Success!

Once created, you can:
- ✅ Login at http://localhost:3000/login
- ✅ Access dashboard
- ✅ Use all features
- ✅ Test the application

**The test user is ready to use!**
