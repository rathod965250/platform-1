'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const {
    register,
    handleSubmit,
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          college: data.college || null,
          graduation_year: data.graduation_year ? parseInt(data.graduation_year) : null,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
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
          disabled={isLoading}
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
          className="bg-gray-100 dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="college">College/Institution</Label>
        <Input
          id="college"
          {...register('college')}
          placeholder="Your College Name"
          disabled={isLoading}
        />
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
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+91 9876543210"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}

