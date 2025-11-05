'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RotateCcw, Loader2, Lock, Eye, EyeOff, Shield, Users, Globe, Mail, Phone } from 'lucide-react'

interface PrivacyPreferences {
  leaderboardVisibility?: boolean
  profileVisibility?: boolean
  showEmail?: boolean
  showPhone?: boolean
}

const defaultPreferences: PrivacyPreferences = {
  leaderboardVisibility: true,
  profileVisibility: true,
  showEmail: false,
  showPhone: false,
}

interface PrivacySecurityProps {
  userId: string
  currentPreferences: PrivacyPreferences | null
}

export function PrivacySecurity({
  userId,
  currentPreferences,
}: PrivacySecurityProps) {
  const [privacyPreferences, setPrivacyPreferences] = useState<PrivacyPreferences>(() => ({
    ...defaultPreferences,
    ...(currentPreferences || {}),
  }))
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function for privacy preferences
  const savePreferences = useCallback(async (newPreferences: PrivacyPreferences) => {
    if (!userId) {
      console.error('Cannot save preferences: userId is missing')
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

        // Update preferences
        const { error } = await supabase
          .from('profiles')
          .update({ privacy_preferences: newPreferences })
          .eq('id', userId)

        if (error) {
          console.error('Error updating privacy preferences:', error)
          const errorMessage = error.message || 'Failed to update privacy preferences'
          toast.error(errorMessage)
        } else {
          toast.success('Privacy preferences updated!')
        }
      } catch (error: any) {
        console.error('Error updating privacy preferences (catch):', error)
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

  const handlePrivacyToggle = (key: keyof PrivacyPreferences, value: boolean) => {
    const newPreferences = {
      ...privacyPreferences,
      [key]: value,
    }
    setPrivacyPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      const supabase = createClient()
      
      // First verify user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser || authUser.id !== userId) {
        console.error('Authentication error:', { authError, authUser, userId })
        toast.error('Authentication failed. Please refresh the page and try again.')
        return
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) {
        console.error('Error changing password:', error)
        const errorMessage = error.message || 'Failed to change password'
        toast.error(errorMessage)
      } else {
        toast.success('Password changed successfully!')
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error: any) {
      console.error('Error changing password (catch):', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleResetPrivacy = async () => {
    if (!userId) {
      console.error('Cannot reset preferences: userId is missing')
      toast.error('User ID is missing. Please refresh the page and try again.')
      return
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    setPrivacyPreferences(defaultPreferences)
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

      // Update preferences
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_preferences: defaultPreferences })
        .eq('id', userId)

      if (error) {
        console.error('Error resetting privacy preferences:', error)
        const errorMessage = error.message || 'Failed to reset privacy preferences'
        toast.error(errorMessage)
      } else {
        toast.success('Privacy preferences reset to defaults!')
      }
    } catch (error: any) {
      console.error('Error resetting privacy preferences (catch):', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const privacyLabels: Record<keyof PrivacyPreferences, { label: string; description: string; icon: React.ElementType }> = {
    leaderboardVisibility: {
      label: 'Leaderboard Visibility',
      description: 'Show your profile on leaderboards',
      icon: Users,
    },
    profileVisibility: {
      label: 'Profile Visibility',
      description: 'Allow others to view your profile',
      icon: Globe,
    },
    showEmail: {
      label: 'Show Email',
      description: 'Display your email address on your profile',
      icon: Mail,
    },
    showPhone: {
      label: 'Show Phone',
      description: 'Display your phone number on your profile',
      icon: Phone,
    },
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Save Indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          <span>Saving preferences...</span>
        </div>
      )}

      {/* Change Password Section */}
      <div className="p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Lock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            Change Password
          </h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="newPassword" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="text-xs sm:text-sm md:text-base font-sans pr-10 min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm md:text-base font-medium text-foreground font-sans">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="text-xs sm:text-sm md:text-base font-sans pr-10 min-h-[44px] sm:min-h-[48px] px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isChangingPassword}
            className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Privacy Settings Section */}
      <div className="p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            Privacy Settings
          </h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(privacyLabels).map(([key, { label, description, icon: Icon }]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 border-border hover:bg-accent/50 transition-all duration-200"
            >
              <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <Label htmlFor={key} className="text-sm sm:text-base md:text-lg font-semibold text-foreground cursor-pointer font-sans break-words">
                    {label}
                  </Label>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed pl-6 sm:pl-8">
                  {description}
                </p>
              </div>
              <Switch
                id={key}
                checked={privacyPreferences[key as keyof PrivacyPreferences] ?? false}
                onCheckedChange={(checked) =>
                  handlePrivacyToggle(key as keyof PrivacyPreferences, checked)
                }
                disabled={isSaving}
                className="flex-shrink-0 ml-3 sm:ml-4"
              />
            </div>
          ))}
        </div>

        {/* Reset Button */}
        <div className="pt-3 sm:pt-4 mt-4 sm:mt-5 border-t-2 border-border">
          <Button
            variant="outline"
            onClick={handleResetPrivacy}
            disabled={isSaving}
            className="w-full text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] border-2 border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Reset Privacy Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

