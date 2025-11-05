'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RotateCcw, Loader2, Bell, Mail, Calendar, Trophy, BarChart3 } from 'lucide-react'

interface NotificationPreferences {
  emailNotifications?: boolean
  assignmentReminders?: boolean
  testResults?: boolean
  weeklyReports?: boolean
  achievementNotifications?: boolean
  pushNotifications?: boolean
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  assignmentReminders: true,
  testResults: true,
  weeklyReports: true,
  achievementNotifications: true,
  pushNotifications: false,
}

interface NotificationPreferencesProps {
  userId: string
  currentPreferences: NotificationPreferences | null
}

export function NotificationPreferences({
  userId,
  currentPreferences,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => ({
    ...defaultPreferences,
    ...(currentPreferences || {}),
  }))
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function
  const savePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
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
          .update({ notification_preferences: newPreferences })
          .eq('id', userId)

        if (error) {
          console.error('Error updating notification preferences:', error)
          const errorMessage = error.message || 'Failed to update notification preferences'
          toast.error(errorMessage)
        } else {
          toast.success('Notification preferences updated!')
        }
      } catch (error: any) {
        console.error('Error updating notification preferences (catch):', error)
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

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const handleReset = async () => {
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

    setPreferences(defaultPreferences)
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
        .update({ notification_preferences: defaultPreferences })
        .eq('id', userId)

      if (error) {
        console.error('Error resetting notification preferences:', error)
        const errorMessage = error.message || 'Failed to reset notification preferences'
        toast.error(errorMessage)
      } else {
        toast.success('Notification preferences reset to defaults!')
      }
    } catch (error: any) {
      console.error('Error resetting notification preferences (catch):', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const preferenceLabels: Record<keyof NotificationPreferences, { label: string; description: string; icon: React.ElementType }> = {
    emailNotifications: {
      label: 'Email Notifications',
      description: 'Receive email notifications for important updates',
      icon: Mail,
    },
    assignmentReminders: {
      label: 'Assignment Reminders',
      description: 'Get notified about upcoming assignment deadlines',
      icon: Calendar,
    },
    testResults: {
      label: 'Test Results',
      description: 'Receive notifications when test results are available',
      icon: BarChart3,
    },
    weeklyReports: {
      label: 'Weekly Reports',
      description: 'Get weekly progress reports via email',
      icon: BarChart3,
    },
    achievementNotifications: {
      label: 'Achievement Notifications',
      description: 'Get notified when you unlock new achievements',
      icon: Trophy,
    },
    pushNotifications: {
      label: 'Push Notifications',
      description: 'Receive browser push notifications (requires permission)',
      icon: Bell,
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

      {/* Preferences Toggles */}
      <div className="space-y-3 sm:space-y-4">
        {Object.entries(preferenceLabels).map(([key, { label, description, icon: Icon }]) => (
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
              checked={preferences[key as keyof NotificationPreferences] ?? false}
              onCheckedChange={(checked) =>
                handleToggle(key as keyof NotificationPreferences, checked)
              }
              disabled={isSaving}
              className="flex-shrink-0 ml-3 sm:ml-4"
            />
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <div className="pt-3 sm:pt-4 border-t-2 border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
          className="w-full text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] border-2 border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
        >
          <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}

