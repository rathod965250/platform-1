# Supabase Storage Setup for Avatars

This guide explains how to set up the storage bucket for profile picture uploads with full CRUD operations.

## Step 1: Create Storage Bucket

**IMPORTANT**: You must create the bucket manually in the Supabase Dashboard before running the migration.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** → **Buckets**
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `avatars` (must be exactly this name)
   - **Public**: ✅ **Enable** (required for public URL access)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
6. Click **"Create bucket"**

## Step 2: Run the Migration

After creating the bucket, run the migration file to set up RLS policies:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard → SQL Editor
# Copy and paste the contents of: supabase/migrations/012_create_avatars_storage_bucket.sql
```

The migration will:
- Set up RLS policies for authenticated users to upload, update, and delete their own avatars
- Allow public read access to avatars (for displaying profile pictures)
- Verify that the `avatar_url` column exists in the `profiles` table

## CRUD Operations

The system supports full CRUD operations for profile pictures:

### Create (Upload)
- Users can upload a new profile picture
- Image is cropped to square format (1:1 aspect ratio)
- File is stored at: `avatars/{user-id}/{timestamp}.{ext}`
- `avatar_url` in `profiles` table is updated with the public URL

### Read (Display)
- Profile pictures are displayed from `profiles.avatar_url`
- Used in:
  - Dashboard header avatar
  - Profile dropdown menu
  - Profile modal
  - Account settings

### Update (Replace)
- Users can replace their existing profile picture
- Old avatar is automatically deleted from storage
- New avatar is uploaded and `avatar_url` is updated

### Delete (Remove)
- Users can remove their profile picture
- File is deleted from storage
- `avatar_url` in `profiles` table is set to `NULL`

## Storage Policies

The migration sets up the following RLS policies:

1. **Users can upload their own avatars** - Authenticated users can only upload to their own folder (`avatars/{user-id}/`)
2. **Users can update their own avatars** - Users can update files in their own folder
3. **Users can delete their own avatars** - Users can delete files in their own folder
4. **Public can view avatars** - Anyone can view avatars (for displaying profile pictures)
5. **Users can list their own avatars** - Users can list files in their own folder

## Verification

After setup, test the avatar upload:

1. Navigate to Profile page (click on your avatar in the header → Profile)
2. Click **"Upload Photo"**
3. Select an image file
4. Crop the image to square format
5. Click **"Save"**
6. Verify the image appears in:
   - Profile modal
   - Dashboard header
   - Profile dropdown

## Troubleshooting

### "Bucket not found" Error
- Make sure you created the bucket named `avatars` in the Supabase Dashboard
- Verify the bucket is public (required for public URL access)

### "Permission denied" Error
- Make sure you ran the migration to set up RLS policies
- Verify you're authenticated as a user
- Check that the policies allow access to `avatars` bucket

### Avatar not displaying
- Verify the `avatar_url` column exists in the `profiles` table
- Check that the bucket is public
- Ensure the URL in `profiles.avatar_url` is correct

## File Structure

Avatars are stored with the following structure:
```
avatars/
  └── {user-id}/
      ├── {user-id}-{timestamp}.jpg
      ├── {user-id}-{timestamp}.png
      └── ...
```

The `avatar_url` in the `profiles` table contains the full public URL:
```
https://{project-ref}.supabase.co/storage/v1/object/public/avatars/{user-id}/{filename}
```

