# Quick Fix: Storage RLS Error

## Error: "new row violates row-level security policy"

This error occurs because the RLS (Row Level Security) policies for the "Avatar profile" storage bucket haven't been set up yet.

## Solution: Run the SQL Migration

### Step 1: Open Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run the Migration SQL
1. Click **"New query"**
2. Copy and paste the entire contents of: `supabase/migrations/012_setup_avatar_profile_storage.sql`
3. Click **"Run"** or press `Ctrl+Enter`

### Step 3: Verify the Policies
After running the SQL, verify that the policies were created:
1. Go to **Storage** → **Policies**
2. Look for these policies:
   - "Users can upload their own avatars"
   - "Users can update their own avatars"
   - "Users can delete their own avatars"
   - "Public can view avatars"
   - "Users can list their own avatars"

### Step 4: Test the Upload
1. Navigate to Profile page (click your avatar → Profile)
2. Try uploading a profile picture
3. The error should be resolved

## Alternative: If You Get Errors

If you get errors about policies already existing, the SQL file uses `DROP POLICY IF EXISTS` which should handle this. If you still have issues:

1. Go to **Storage** → **Policies**
2. Manually delete any existing policies for "Avatar profile" bucket
3. Run the SQL again

## Runtime Module Error

The runtime module error in Next.js is usually a transient bundling issue. Try:

1. **Restart the dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **If still failing**, check for any import errors in console

