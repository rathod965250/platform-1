# Troubleshooting "Failed to fetch" Errors

## Quick Diagnosis

If you're seeing "Failed to fetch" errors, follow these steps:

### Step 1: Verify Environment Variables

1. Check if `.env.local` exists in the root directory
2. Verify both variables are set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 2: Restart Development Server

**IMPORTANT:** After creating or updating `.env.local`, you MUST restart your development server:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 3: Check Console for Detailed Errors

The updated error handling will show:
- Which environment variables are missing
- URL format validation warnings
- Network connectivity issues

## Common Causes

### 1. Missing Environment Variables
**Symptoms:** Error thrown immediately when creating Supabase client

**Solution:**
- Create `.env.local` file in root directory
- Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart development server

### 2. Incorrect Supabase URL
**Symptoms:** URL format warning in console

**Solution:**
- URL should start with `https://` (or `http://` for local)
- URL should contain `supabase.co`
- Example: `https://your-project-ref.supabase.co`

### 3. Network Connectivity Issues
**Symptoms:** "Failed to fetch" error when making requests

**Possible causes:**
1. **Supabase project is paused or deleted**
   - Check Supabase dashboard
   - Ensure project is active

2. **Internet connection issues**
   - Check your internet connection
   - Try accessing Supabase dashboard in browser

3. **Firewall/Network restrictions**
   - Check if your network blocks Supabase
   - Try from a different network

4. **CORS issues** (rare)
   - Usually handled automatically by Supabase
   - Check browser console for CORS errors

### 4. Wrong Anon Key
**Symptoms:** Authentication errors or 401/403 responses

**Solution:**
- Get the correct `anon/public` key from Supabase Dashboard
- Settings → API → anon/public key

## Verification Steps

### 1. Test Environment Variables
```bash
# Windows PowerShell
Get-Content .env.local | Select-String "NEXT_PUBLIC_SUPABASE"
```

### 2. Test Supabase Connection
Open browser console and run:
```javascript
// Test connection
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
  .then(r => console.log('✅ Connection OK:', r.status))
  .catch(e => console.error('❌ Connection Failed:', e));
```

### 3. Check Supabase Project Status
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Verify project is active (not paused)
4. Check Settings → API for correct URL and keys

## Solutions Implemented

### Enhanced Error Messages
- Clear indication of which environment variables are missing
- URL format validation warnings
- Detailed network error messages

### Client Caching
- Supabase client is now cached to avoid multiple initializations
- Reduces unnecessary network requests

### Better Fetch Error Handling
- Catches "Failed to fetch" errors specifically
- Provides actionable error messages
- Suggests possible causes and solutions

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check terminal/console** where dev server is running
3. **Verify Supabase project** is active in dashboard
4. **Test connection** using the browser console snippet above
5. **Restart development server** after any `.env.local` changes

## Getting Help

If issues persist:
1. Copy the exact error message from console
2. Check Supabase dashboard project status
3. Verify environment variables are correctly set
4. Test network connectivity to Supabase

