# Supabase Setup Guide

## Environment Variables Required

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Fixing "Failed to fetch" Errors

If you're seeing "Failed to fetch" errors in the console, it's likely because:

1. **Missing `.env.local` file** - Create it in the root directory
2. **Missing environment variables** - Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. **Incorrect values** - Double-check that you copied the correct values from Supabase dashboard
4. **Network issues** - Check if your Supabase project is active and accessible

## Verification Steps

1. **Check if `.env.local` exists:**
   ```bash
   # Windows PowerShell
   Test-Path .env.local
   
   # Should return: True
   ```

2. **Verify environment variables are loaded:**
   - Restart your Next.js development server after creating/updating `.env.local`
   - The server needs to be restarted for environment variables to be loaded

3. **Check console for errors:**
   - If variables are missing, you'll see clear error messages indicating which ones are missing

## Restart Development Server

After creating or updating `.env.local`, **always restart your development server**:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Troubleshooting

### Error: "Supabase environment variables are not configured"

**Solution:** 
- Create `.env.local` file in the root directory
- Add both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the development server

### Error: "Failed to fetch" in browser console

**Possible causes:**
1. Environment variables not set correctly
2. Supabase project is paused or deleted
3. Network connectivity issues
4. CORS configuration issues (rare)

**Solution:**
1. Verify environment variables are set correctly
2. Check Supabase dashboard to ensure project is active
3. Try accessing Supabase URL directly in browser
4. Check browser console for more detailed error messages

### Error: Network request failed

**Solution:**
- Check your internet connection
- Verify Supabase project URL is correct
- Make sure Supabase project is not paused
- Check if there are any firewall or network restrictions

## Next Steps

Once environment variables are configured:
1. Restart your development server
2. Try accessing the application
3. Check browser console - errors should be resolved
4. Test authentication flow (login/signup)

