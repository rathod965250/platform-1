# Alternative: Setup Storage Policies via Supabase Dashboard UI

If you're getting permission errors with SQL, you can create the policies using the Supabase Dashboard UI instead.

## Step 1: Navigate to Storage Policies

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** → **Policies** (or go to **Storage** → **Buckets** → Click on "Avatar profile" → **Policies** tab)

## Step 2: Create Each Policy

Create these 5 policies one by one:

### Policy 1: Users can upload their own avatars

1. Click **"New Policy"** or **"Create Policy"**
2. Choose **"Create a policy from scratch"**
3. Configure:
   - **Policy name**: `Users can upload their own avatars`
   - **Allowed operation**: `INSERT` (or `Upload`)
   - **Target roles**: `authenticated`
   - **Policy definition**: Paste this:
     ```sql
     bucket_id = 'Avatar profile' AND
     (storage.foldername(name))[1] = auth.uid()::text
     ```
4. Click **"Review"** then **"Save policy"**

### Policy 2: Users can update their own avatars

1. Click **"New Policy"**
2. Choose **"Create a policy from scratch"**
3. Configure:
   - **Policy name**: `Users can update their own avatars`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     bucket_id = 'Avatar profile' AND
     (storage.foldername(name))[1] = auth.uid()::text
     ```
   - **WITH CHECK expression**:
     ```sql
     bucket_id = 'Avatar profile' AND
     (storage.foldername(name))[1] = auth.uid()::text
     ```
4. Click **"Review"** then **"Save policy"**

### Policy 3: Users can delete their own avatars

1. Click **"New Policy"**
2. Choose **"Create a policy from scratch"**
3. Configure:
   - **Policy name**: `Users can delete their own avatars`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **Policy definition**:
     ```sql
     bucket_id = 'Avatar profile' AND
     (storage.foldername(name))[1] = auth.uid()::text
     ```
4. Click **"Review"** then **"Save policy"**

### Policy 4: Public can view avatars

1. Click **"New Policy"**
2. Choose **"Create a policy from scratch"**
3. Configure:
   - **Policy name**: `Public can view avatars`
   - **Allowed operation**: `SELECT` (or `Read`)
   - **Target roles**: `public`
   - **Policy definition**:
     ```sql
     bucket_id = 'Avatar profile'
     ```
4. Click **"Review"** then **"Save policy"**

### Policy 5: Users can list their own avatars

1. Click **"New Policy"**
2. Choose **"Create a policy from scratch"**
3. Configure:
   - **Policy name**: `Users can list their own avatars`
   - **Allowed operation**: `SELECT` (or `Read`)
   - **Target roles**: `authenticated`
   - **Policy definition**:
     ```sql
     bucket_id = 'Avatar profile' AND
     (storage.foldername(name))[1] = auth.uid()::text
     ```
4. Click **"Review"** then **"Save policy"**

## Step 3: Verify

After creating all 5 policies, you should see them listed in the Storage Policies page. Try uploading a profile picture again - it should work now!

