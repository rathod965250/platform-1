'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Info } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  college: z.string().optional(),
  graduation_year: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: any
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [canUpdateProfile, setCanUpdateProfile] = useState(true)
  const [lastProfileUpdate, setLastProfileUpdate] = useState<string | null>(null)
  const [daysUntilUpdate, setDaysUntilUpdate] = useState<number | null>(null)

  useEffect(() => {
    async function checkProfileUpdateStatus() {
      if (!profile?.id) return

      try {
        // Fetch last update date (check updated_at field)
        const { data, error } = await supabase
          .from('profiles')
          .select('updated_at')
          .eq('id', profile.id)
          .single()

        if (error) throw error

        if (data?.updated_at) {
          const lastUpdate = new Date(data.updated_at)
          const createdAt = data?.created_at ? new Date(data.created_at) : null
          const now = new Date()
          
          // If updated_at is the same as created_at (or very close), allow update
          if (createdAt && Math.abs(lastUpdate.getTime() - createdAt.getTime()) < 1000) {
            setCanUpdateProfile(true)
            setLastProfileUpdate(null)
            setDaysUntilUpdate(null)
          } else {
            const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
            const daysRemaining = 30 - daysDiff

            if (daysRemaining > 0 && daysDiff < 30) {
              setCanUpdateProfile(false)
              setDaysUntilUpdate(daysRemaining)
              setLastProfileUpdate(data.updated_at)
            } else {
              setCanUpdateProfile(true)
              setDaysUntilUpdate(null)
              setLastProfileUpdate(data.updated_at)
            }
          }
        } else {
          setCanUpdateProfile(true)
          setLastProfileUpdate(null)
          setDaysUntilUpdate(null)
        }
      } catch (error) {
        console.error('Error checking profile update status:', error)
      }
    }

    checkProfileUpdateStatus()
  }, [profile?.id, supabase])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      college: profile?.college || '',
      graduation_year: profile?.graduation_year?.toString() || '',
      phone: profile?.phone || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      // Check if profile update is allowed (once per month limit)
      if (!canUpdateProfile && daysUntilUpdate !== null && daysUntilUpdate > 0) {
        toast.error(`Profile can only be updated once per month. You can update again in ${daysUntilUpdate} day(s).`)
        setIsLoading(false)
        return
      }

      // Prepare update data
      const updateData: any = {
        full_name: data.full_name,
        college: data.college || null,
        graduation_year: data.graduation_year ? parseInt(data.graduation_year) : null,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      // Reset update status after successful update
      setCanUpdateProfile(false)
      setLastProfileUpdate(new Date().toISOString())
      setDaysUntilUpdate(30)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="John Doe"
          disabled={isLoading || !canUpdateProfile}
        />
        {errors.full_name && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Read-only)</Label>
        <Input
          id="email"
          type="email"
          value={profile?.email || ''}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="college">College/Institution</Label>
        <Input
          id="college"
          {...register('college')}
          placeholder="Enter your college name"
          disabled={isLoading || !canUpdateProfile}
        />
        {!canUpdateProfile && daysUntilUpdate !== null && (
          <Alert className="mt-2">
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Profile can only be updated once per month. You can update again in {daysUntilUpdate} day(s).
              {lastProfileUpdate && (
                <span className="block text-xs mt-1">
                  Last updated: {new Date(lastProfileUpdate).toLocaleDateString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        {canUpdateProfile && lastProfileUpdate && (
          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can update your profile now. After updating, you'll need to wait 30 days before the next update.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="graduation_year">Graduation Year</Label>
        <Input
          id="graduation_year"
          type="number"
          {...register('graduation_year')}
          placeholder="2025"
          min="2020"
          max="2030"
          disabled={isLoading || !canUpdateProfile}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+91 9876543210"
          disabled={isLoading || !canUpdateProfile}
        />
      </div>

      <Button type="submit" disabled={isLoading || !canUpdateProfile} className="w-full">
        {isLoading ? 'Saving...' : canUpdateProfile ? 'Save Changes' : `Update Disabled (${daysUntilUpdate} days remaining)`}
      </Button>
    </form>
  )
}

