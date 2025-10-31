# Authentication Fix Guide

## Issues Identified

1. **MCP Server Configuration**: The MCP config uses the anon key instead of a personal access token
2. **Potential Email Confirmation**: Supabase might require email confirmation
3. **Need to verify database connection and RLS policies**

## Steps to Fix

### 1. Test the Authentication Flow

Visit: http://localhost:3000/test-auth

This page will help diagnose:
- Supabase connection status
- Database table accessibility
- Signup functionality
- Login functionality

### 2. Create a Test User

If you don't have a test user yet:

1. Go to http://localhost:3000/signup
2. Create an account with:
   - Email: test@example.com
   - Password: Test123456!
   - Full Name: Test User

3. Check your Supabase dashboard:
   - Go to https://supabase.com/dashboard/project/rscxnpoffeedqfgynnct
   - Navigate to Authentication > Users
   - Verify the user was created

### 3. Disable Email Confirmation (for testing)

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Find "Email Confirmation"
3. Disable it for testing purposes
4. Try logging in again

### 4. Check RLS Policies

The database has RLS enabled. Verify policies are working:
1. Go to Supabase Dashboard > Database > Policies
2. Check that profiles table has proper policies

### 5. Fix MCP Server (Optional - for advanced database operations)

To use MCP server for database operations, you need a personal access token:

1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Update your MCP config at: `c:\Users\ratho\.codeium\windsurf\mcp_config.json`
4. Replace the anon key with your personal access token

## Common Login Issues

### Issue 1: "Invalid login credentials"
- **Cause**: Wrong email/password or user doesn't exist
- **Fix**: Create a new account via signup page

### Issue 2: "Email not confirmed"
- **Cause**: Email confirmation is required
- **Fix**: Check email for confirmation link or disable email confirmation in Supabase settings

### Issue 3: No error but nothing happens
- **Cause**: JavaScript error or network issue
- **Fix**: Check browser console for errors

### Issue 4: Redirect loop
- **Cause**: Middleware or auth callback issue
- **Fix**: Check middleware.ts and auth/callback/route.ts

## Testing Checklist

- [ ] Can access test-auth page
- [ ] Supabase connection test passes
- [ ] Can create new user via signup
- [ ] User appears in Supabase dashboard
- [ ] Can login with created user
- [ ] Redirects to dashboard after login
- [ ] User session persists on page refresh

## Next Steps

1. Visit http://localhost:3000/test-auth
2. Run connection test
3. Try signup with a test email
4. Try login with the same credentials
5. Check the results JSON for any errors
