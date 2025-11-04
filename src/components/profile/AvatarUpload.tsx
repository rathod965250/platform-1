'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ImageCropper } from './ImageCropper'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  onUploadComplete: (avatarUrl: string) => void
}

export function AvatarUpload({
  currentAvatarUrl,
  userId,
  onUploadComplete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview for cropping
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      setCropImage(imageUrl)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setShowCropper(false)
    // Create preview from cropped blob
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedImageBlob)
    
    // Upload cropped image
    await uploadAvatar(croppedImageBlob)
  }

  const uploadAvatar = async (file: File | Blob) => {
    setUploading(true)
    try {
      const supabase = createClient()

      const BUCKET_NAME = 'Avatar profile'

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        try {
          // Extract path from URL - handle both "avatars" and "Avatar profile" (which may be URL-encoded)
          // URL format: https://xxx.supabase.co/storage/v1/object/public/Avatar%20profile/user-id/file.jpg
          const urlPatterns = [
            '/Avatar profile/',
            '/Avatar%20profile/',
            '/avatars/',
            '/Avatar profile',
            '/Avatar%20profile',
            '/avatars'
          ]
          
          let oldPath: string | null = null
          for (const pattern of urlPatterns) {
            const urlParts = currentAvatarUrl.split(pattern)
            if (urlParts.length > 1) {
              oldPath = urlParts[1]
              break
            }
          }
          
          if (oldPath) {
            await supabase.storage.from(BUCKET_NAME).remove([oldPath])
          }
        } catch (err) {
          // Ignore errors when deleting old avatar
          console.warn('Could not delete old avatar:', err)
        }
      }

      // Generate unique filename
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg'
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket not configured. Please set up the "Avatar profile" bucket in Supabase Storage.')
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      toast.success('Profile picture updated successfully!')
      setPreview(publicUrl)
      onUploadComplete(publicUrl)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload profile picture')
      // Reset preview on error
      setPreview(currentAvatarUrl || null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!currentAvatarUrl) return

    setUploading(true)
    try {
      const supabase = createClient()

      const BUCKET_NAME = 'Avatar profile'

      // Delete from storage
      try {
        // Extract path from URL - handle both "avatars" and "Avatar profile" (which may be URL-encoded)
        const urlPatterns = [
          '/Avatar profile/',
          '/Avatar%20profile/',
          '/avatars/',
          '/Avatar profile',
          '/Avatar%20profile',
          '/avatars'
        ]
        
        let oldPath: string | null = null
        for (const pattern of urlPatterns) {
          const urlParts = currentAvatarUrl.split(pattern)
          if (urlParts.length > 1) {
            oldPath = urlParts[1]
            break
          }
        }
        
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath])
        }
      } catch (err) {
        console.warn('Could not delete avatar from storage:', err)
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error

      toast.success('Profile picture removed')
      setPreview(null)
      onUploadComplete('')
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      toast.error(error.message || 'Failed to remove profile picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={preview || undefined} alt="Profile" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-lg">
              {preview ? 'U' : 'U'}
            </AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
            disabled={uploading || showCropper}
          />
          <label htmlFor="avatar-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || showCropper}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </span>
            </Button>
          </label>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading || showCropper}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {cropImage && (
        <ImageCropper
          imageSrc={cropImage}
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false)
            setCropImage(null)
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  )
}

