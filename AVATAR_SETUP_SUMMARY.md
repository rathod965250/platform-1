# Avatar Storage Setup Summary

## Overview
The profile picture system supports full CRUD operations with image cropping and storage in Supabase.

## Setup Steps

### 1. Create Storage Bucket (Manual)
1. Go to Supabase Dashboard → Storage → Buckets
2. Click "New bucket"
3. Configure:
   - **Name**: `avatars`
   - **Public**: ✅ Enable
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

### 2. Run Migration
Run the migration file: `supabase/migrations/012_create_avatars_storage_bucket.sql`

This will:
- Set up RLS policies for authenticated users
- Allow public read access
- Verify `avatar_url` column exists in `profiles` table

## CRUD Operations

### ✅ Create (Upload)
- **Component**: `AvatarUpload.tsx`
- **Process**:
  1. User selects image file
  2. Image is cropped to square (1:1) using `ImageCropper.tsx`
  3. Cropped image is uploaded to `avatars/{user-id}/{timestamp}.{ext}`
  4. Public URL is retrieved
  5. `profiles.avatar_url` is updated with the public URL

### ✅ Read (Display)
- **Location**: `profiles.avatar_url` column
- **Displayed in**:
  - Dashboard header (`DashboardShell.tsx`)
  - Profile dropdown (`ProfileDropdown` component)
  - Profile modal (`AccountModals.tsx`)
  - Profile page (if exists)

### ✅ Update (Replace)
- **Component**: `AvatarUpload.tsx`
- **Process**:
  1. Old avatar file is deleted from storage
  2. New image is cropped and uploaded
  3. `profiles.avatar_url` is updated with new public URL

### ✅ Delete (Remove)
- **Component**: `AvatarUpload.tsx`
- **Process**:
  1. Avatar file is deleted from storage
  2. `profiles.avatar_url` is set to `NULL`

## Database Schema

### `profiles` Table
```sql
avatar_url TEXT  -- Stores the full public URL to the avatar image
```

### Storage Structure
```
avatars/
  └── {user-id}/
      ├── {user-id}-{timestamp}.jpg
      └── ...
```

## Files Involved

### Components
- `src/components/profile/AvatarUpload.tsx` - Main upload component with CRUD logic
- `src/components/profile/ImageCropper.tsx` - Image cropping dialog
- `src/components/dashboard/AccountModals.tsx` - Profile modal with avatar display
- `src/components/dashboard/DashboardShell.tsx` - Header with avatar display

### Migrations
- `supabase/migrations/012_create_avatars_storage_bucket.sql` - Storage policies setup

### Documentation
- `STORAGE_SETUP.md` - Detailed setup guide
- `AVATAR_SETUP_SUMMARY.md` - This file

## Security

### RLS Policies
- Users can only upload/update/delete their own avatars (in their own folder)
- Public read access for displaying avatars
- Authenticated users can list their own avatar files

### File Validation
- File type: Image files only (`image/*`)
- File size: Maximum 5MB
- Aspect ratio: Automatically cropped to square (1:1)

## Testing

After setup, test:
1. Upload a new avatar → Verify it appears in all locations
2. Replace existing avatar → Verify old one is deleted, new one appears
3. Remove avatar → Verify it's removed from storage and profile
4. Verify `profiles.avatar_url` is updated correctly in database

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Bucket not found" | Create the `avatars` bucket in Supabase Dashboard |
| "Permission denied" | Run the migration to set up RLS policies |
| Avatar not displaying | Check `profiles.avatar_url` has the correct URL |
| Upload fails | Verify bucket is public and RLS policies are set |

