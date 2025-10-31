# Authentication Setup - Complete Guide

## ✅ What Has Been Fixed

### 1. Enhanced Login Form
- Added comprehensive error logging
- Better error messages for users
- Console logging for debugging
- Improved error handling for profile fetching

### 2. Debug Tools Added

#### Test Authentication Page
**URL**: http://localhost:3000/test-auth

Features:
- Test Supabase connection
- Test signup functionality
- Test login functionality
- View detailed error messages
- Check database accessibility

#### Debug Component on Login Page
- Shows configuration status
- Displays session information
- Checks database connectivity
- Only visible in development mode

### 3. Documentation Created

- `AUTHENTICATION_FIX.md` - Troubleshooting guide
- `create-admin-user.sql` - Script to promote users to admin
- `test-supabase-connection.js` - Browser console test script

## 🔧 How to Test Authentication

### Step 1: Check Configuration
1. Open browser console (F12)
2. Go to http://localhost:3000/login
3. Expand "Debug Info" section at bottom of login form
4. Verify:
   - ✅ hasUrl: true
   - ✅ hasKey: true
   - ✅ database.accessible: true

### Step 2: Create Test User

**Option A: Via Signup Page**
1. Go to http://localhost:3000/signup
2. Fill in:
   - Email: your-email@example.com
   - Password: TestPassword123!
   - Full Name: Test User
3. Click "Sign up"
4. Check console for any errors

**Option B: Via Test Page**
1. Go to http://localhost:3000/test-auth
2. Enter email and password
3. Click "Test Signup"
4. Check results JSON

### Step 3: Verify User in Supabase
1. Go to https://supabase.com/dashboard/project/rscxnpoffeedqfgynnct
2. Navigate to Authentication > Users
3. Confirm user was created
4. If email confirmation is enabled, confirm the email

### Step 4: Test Login

**Option A: Via Login Page**
1. Go to http://localhost:3000/login
2. Enter your credentials
3. Open browser console (F12)
4. Click "Log in"
5. Watch console for logs:
   ```
   Attempting login with email: ...
   Login response: { authData: ..., authError: ... }
   User logged in: ...
   Profile loaded: ...
   ```
6. Should redirect to /dashboard

**Option B: Via Test Page**
1. Go to http://localhost:3000/test-auth
2. Enter credentials
3. Click "Test Login"
4. Check results JSON for success/error

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid login credentials"

**Possible Causes:**
- User doesn't exist
- Wrong password
- Email not confirmed (if confirmation is enabled)

**Solutions:**
1. Create a new account via signup
2. Check Supabase dashboard to verify user exists
3. Disable email confirmation in Supabase settings (for testing)

**Steps to Disable Email Confirmation:**
1. Go to Supabase Dashboard
2. Settings > Authentication
3. Find "Enable email confirmations"
4. Toggle it OFF
5. Try logging in again

### Issue 2: "Email not confirmed"

**Solution:**
1. Check your email inbox for confirmation link
2. OR disable email confirmation (see above)
3. OR manually confirm in Supabase dashboard:
   - Authentication > Users
   - Click on user
   - Click "Confirm email"

### Issue 3: Login button does nothing

**Check:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check Network tab for failed requests
4. Verify environment variables are loaded (check Debug Info)

**Common Causes:**
- Environment variables not loaded (restart dev server)
- Network error (check Supabase project status)
- JavaScript error (check console)

### Issue 4: "Could not load profile data"

**This is usually OK** - means login succeeded but profile fetch failed.

**Possible Causes:**
- RLS policy blocking profile access
- Profile not created (trigger failed)

**Solution:**
1. Check Supabase dashboard > Database > profiles table
2. Verify user has a profile row
3. If not, run this SQL in Supabase SQL Editor:
   ```sql
   INSERT INTO profiles (id, email, role)
   SELECT id, email, 'student'
   FROM auth.users
   WHERE id = 'USER_ID_HERE';
   ```

### Issue 5: Redirect loop

**Cause:** Middleware or auth callback issue

**Solution:**
1. Check middleware.ts is working
2. Verify auth/callback/route.ts exists
3. Clear browser cookies and try again

## 📊 Database Schema

### Profiles Table
```sql
- id: UUID (references auth.users)
- email: TEXT
- full_name: TEXT
- role: TEXT (student/admin)
- avatar_url: TEXT
- college: TEXT
- graduation_year: INTEGER
- target_companies: TEXT[]
- phone: TEXT
```

### Row Level Security (RLS)
- Users can view/update their own profile
- Admins can view all profiles
- Profile automatically created on signup via trigger

## 🔐 MCP Server Configuration (Optional)

The MCP server in your config uses the anon key, which won't work for management operations.

**To fix (if needed):**
1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new Personal Access Token
3. Update `c:\Users\ratho\.codeium\windsurf\mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "supabase-mcp-server": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server-supabase@latest",
           "--access-token",
           "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
         ]
       }
     }
   }
   ```

## ✅ Testing Checklist

- [ ] Environment variables loaded (check Debug Info)
- [ ] Can access login page
- [ ] Can access signup page
- [ ] Can create new user
- [ ] User appears in Supabase dashboard
- [ ] Can login with created user
- [ ] Console shows login logs
- [ ] Redirects to dashboard after login
- [ ] Session persists on page refresh
- [ ] Can logout and login again

## 🎯 Next Steps

1. **Test the login flow:**
   - Visit http://localhost:3000/login
   - Check Debug Info section
   - Try logging in
   - Watch browser console

2. **If login fails:**
   - Go to http://localhost:3000/test-auth
   - Run all tests
   - Check results JSON
   - Follow troubleshooting guide above

3. **Create admin user (if needed):**
   - Create regular user via signup
   - Run SQL from `create-admin-user.sql`
   - Login to access admin panel

4. **Verify everything works:**
   - Login successfully
   - Access dashboard
   - Check profile page
   - Try practice/test features

## 📝 Important Notes

- All console logs are for debugging only
- Remove or disable logs in production
- Debug component only shows in development
- Keep your Supabase keys secure
- Never commit .env.local to git

## 🆘 Still Having Issues?

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify Supabase project is active
4. Check Supabase logs in dashboard
5. Try test-auth page for detailed diagnostics
6. Verify environment variables are correct
7. Restart development server
