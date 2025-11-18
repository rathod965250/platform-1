'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, User, Mail, Phone, GraduationCap, Calendar, Building2, Target } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  college: string | null
  graduation_year: number | null
  target_companies: string[] | null
  avatar_url: string | null
}

interface ProfileSettingsProps {
  userId: string
  currentProfile: Profile | null
}

const GRADUATION_YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() + i
  return { value: year.toString(), label: year.toString() }
})

const COMMON_COMPANIES = [
  'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra',
  'Accenture', 'Cognizant', 'Capgemini', 'IBM', 'Microsoft',
  'Google', 'Amazon', 'Apple', 'Oracle', 'SAP',
  'Adobe', 'Salesforce', 'Deloitte', 'PwC', 'EY',
  'Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Barclays',
  'JP Morgan Chase', 'Visa', 'Mastercard', 'PayPal',
  'Netflix', 'Meta', 'Twitter', 'LinkedIn', 'Uber',
  'Airbnb', 'Tesla', 'NVIDIA', 'Intel', 'AMD'
]

export function ProfileSettings({
  userId,
  currentProfile,
}: ProfileSettingsProps) {
  const [profile, setProfile] = useState<Profile>(() => ({
    id: userId,
    email: currentProfile?.email || '',
    full_name: currentProfile?.full_name || '',
    phone: currentProfile?.phone || '',
    college: currentProfile?.college || '',
    graduation_year: currentProfile?.graduation_year || null,
    target_companies: currentProfile?.target_companies || [],
    avatar_url: currentProfile?.avatar_url || null,
  }))
  const [targetCompaniesInput, setTargetCompaniesInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function
  const saveProfile = useCallback(async (newProfile: Partial<Profile>) => {
    if (!userId) {
      console.error('Cannot save profile: userId is missing')
      toast.error('User ID is missing. Please refresh the page and try again.')
      return
    }

    // Clear existing timeout if any
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const supabase = createClient()
        
        // First verify user is authenticated
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser || authUser.id !== userId) {
          console.error('Authentication error:', { authError, authUser, userId })
          toast.error('Authentication failed. Please refresh the page and try again.')
          return
        }

        // Prepare update data
        const updateData: any = {
          ...newProfile,
          updated_at: new Date().toISOString(),
        }

        // Update profile
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId)

        if (error) {
          console.error('Error updating profile:', error)
          const errorMessage = error.message || 'Failed to update profile'
          toast.error(errorMessage)
        } else {
          toast.success('Profile updated successfully!')
        }
      } catch (error: any) {
        console.error('Error updating profile (catch):', error)
        const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
        toast.error(errorMessage)
      } finally {
        setIsSaving(false)
      }
    }, 1000) // 1 second debounce
  }, [userId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleFieldChange = (field: keyof Profile, value: any) => {
    const newProfile = {
      ...profile,
      [field]: value,
    }
    setProfile(newProfile)
    saveProfile({ [field]: value })
  }

  const handleAvatarUpdate = (avatarUrl: string | null) => {
    setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
    saveProfile({ avatar_url: avatarUrl })
  }

  const handleAddCompany = (companyName?: string) => {
    const company = (companyName || targetCompaniesInput).trim()
    if (!company) return

    const companies = Array.isArray(profile.target_companies) ? profile.target_companies : []
    if (companies.includes(company)) {
      toast.error('Company already added')
      return
    }

    const newCompanies = [...companies, company]
    if (!companyName) {
      setTargetCompaniesInput('')
    }
    handleFieldChange('target_companies', newCompanies)
  }

  const handleRemoveCompany = (company: string) => {
    const companies = profile.target_companies || []
    const newCompanies = companies.filter(c => c !== company)
    handleFieldChange('target_companies', newCompanies)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCompany()
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Save Indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          <span>Saving profile...</span>
        </div>
      )}

      {/* Avatar Upload */}
      <div className="space-y-2 sm:space-y-3">
        <Label className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans">
          Profile Picture
        </Label>
        <AvatarUpload
          currentAvatarUrl={profile.avatar_url}
          userId={userId}
          onUploadComplete={handleAvatarUpdate}
        />
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2 sm:space-y-2.5">
        <Label htmlFor="email" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans bg-muted cursor-not-allowed min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
        />
        <p className="text-xs sm:text-sm text-muted-foreground font-sans">
          Email cannot be changed. Contact support if you need to update your email.
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2 sm:space-y-2.5">
        <Label htmlFor="full_name" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Full Name
        </Label>
        <Input
          id="full_name"
          type="text"
          value={profile.full_name || ''}
          onChange={(e) => handleFieldChange('full_name', e.target.value || null)}
          placeholder="Enter your full name"
          className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2 sm:space-y-2.5">
        <Label htmlFor="phone" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          value={profile.phone || ''}
          onChange={(e) => handleFieldChange('phone', e.target.value || null)}
          placeholder="Enter your phone number"
          className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
        />
      </div>

      {/* College */}
      <div className="space-y-2 sm:space-y-2.5">
        <Label htmlFor="college" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          College/University
        </Label>
        <Input
          id="college"
          type="text"
          value={profile.college || ''}
          onChange={(e) => handleFieldChange('college', e.target.value || null)}
          placeholder="Enter your college/university name"
          className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
        />
      </div>

      {/* Graduation Year */}
      <div className="space-y-2 sm:space-y-2.5">
        <Label htmlFor="graduation_year" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Graduation Year
        </Label>
        <Select
          value={profile.graduation_year?.toString() || 'none'}
          onValueChange={(value) => handleFieldChange('graduation_year', value === 'none' ? null : parseInt(value))}
        >
          <SelectTrigger className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px]">
            <SelectValue placeholder="Select graduation year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {GRADUATION_YEARS.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Companies */}
      <div className="space-y-2 sm:space-y-2.5">
        <Label htmlFor="target_companies" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Target Companies
        </Label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            id="target_companies"
            type="text"
            value={targetCompaniesInput}
            onChange={(e) => setTargetCompaniesInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter company name and press Enter"
            className="text-xs sm:text-sm md:text-base font-sans flex-1 min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
          />
          <Button
            type="button"
            onClick={() => handleAddCompany()}
            disabled={!targetCompaniesInput.trim()}
            className="text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6"
          >
            Add
          </Button>
        </div>
        
        {/* Quick Select Companies */}
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {COMMON_COMPANIES.slice(0, 8).map((company) => (
            <Button
              key={company}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddCompany(company)}
              disabled={profile.target_companies?.includes(company)}
              className="text-xs sm:text-sm font-medium h-8 sm:h-9 px-2 sm:px-3"
            >
              {company}
            </Button>
          ))}
        </div>

        {/* Selected Companies */}
        {profile.target_companies && profile.target_companies.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-2 sm:mt-3">
            {profile.target_companies.map((company) => (
              <div
                key={company}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/10 text-primary border-2 border-primary/20 text-xs sm:text-sm font-medium font-sans"
              >
                <span>{company}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCompany(company)}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Remove ${company}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

