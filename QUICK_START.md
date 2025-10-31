# 🚀 Quick Start - Authentication Testing

## Test URLs

1. **Login Page**: http://localhost:3000/login
2. **Signup Page**: http://localhost:3000/signup
3. **Test Auth Page**: http://localhost:3000/test-auth

## Quick Test Steps

### 1️⃣ Create Account (30 seconds)
```
1. Go to: http://localhost:3000/signup
2. Enter:
   - Email: test@example.com
   - Password: Test123456!
   - Name: Test User
3. Click "Sign up"
4. Check browser console for logs
```

### 2️⃣ Login (15 seconds)
```
1. Go to: http://localhost:3000/login
2. Enter same credentials
3. Open browser console (F12)
4. Click "Log in"
5. Watch console logs
6. Should redirect to /dashboard
```

### 3️⃣ If Login Fails
```
1. Go to: http://localhost:3000/test-auth
2. Click "Test Supabase Connection"
3. Enter credentials
4. Click "Test Login"
5. Check results JSON for errors
```

## Browser Console Logs to Watch

When you click login, you should see:
```
✅ Attempting login with email: test@example.com
✅ Login response: { authData: {...}, authError: null }
✅ User logged in: test@example.com
✅ Profile loaded: {...}
```

## Common Errors & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| "Invalid login credentials" | Create account via signup first |
| "Email not confirmed" | Disable email confirmation in Supabase dashboard |
| Button does nothing | Check browser console for errors |
| "Could not load profile" | Login succeeded, just profile issue - OK to continue |

## Supabase Dashboard

**URL**: https://supabase.com/dashboard/project/rscxnpoffeedqfgynnct

**Quick Checks:**
- Authentication > Users (verify user created)
- Database > profiles (verify profile exists)
- Settings > Authentication (disable email confirmation for testing)

## Debug Info

On login page, expand "Debug Info" section to see:
- ✅ Configuration status
- ✅ Database connectivity
- ✅ Session status

## Need More Help?

See `AUTHENTICATION_SETUP_COMPLETE.md` for detailed troubleshooting.
