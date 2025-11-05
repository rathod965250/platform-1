'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/uiStore'
import { toast } from 'sonner'
import { RotateCcw, Loader2, Palette, Type, Layout } from 'lucide-react'

interface AppearancePreferences {
  themeMode?: 'light' | 'dark' | 'system'
  fontSize?: 'small' | 'medium' | 'large'
  compactMode?: boolean
}

const defaultPreferences: AppearancePreferences = {
  themeMode: 'system',
  fontSize: 'medium',
  compactMode: false,
}

interface AppearancePreferencesProps {
  userId: string
  currentPreferences: AppearancePreferences | null
}

export function AppearanceSettings({
  userId,
  currentPreferences,
}: AppearancePreferencesProps) {
  const { theme, setTheme } = useUIStore()
  const [preferences, setPreferences] = useState<AppearancePreferences>(() => ({
    ...defaultPreferences,
    ...(currentPreferences || {}),
  }))
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync theme with UI store
  useEffect(() => {
    if (preferences.themeMode && preferences.themeMode !== 'system') {
      setTheme(preferences.themeMode as 'light' | 'dark')
    } else if (preferences.themeMode === 'system') {
      // Detect system preference
      if (typeof window !== 'undefined') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setTheme(systemTheme)
      }
    }
  }, [preferences.themeMode, setTheme])

  // Debounced save function
  const savePreferences = useCallback(async (newPreferences: AppearancePreferences) => {
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
          .update({ appearance_preferences: newPreferences })
          .eq('id', userId)

        if (error) {
          console.error('Error updating appearance preferences:', error)
          const errorMessage = error.message || 'Failed to update appearance preferences'
          toast.error(errorMessage)
        } else {
          toast.success('Appearance preferences updated!')
        }
      } catch (error: any) {
        console.error('Error updating appearance preferences (catch):', error)
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

  const handleThemeChange = (value: string) => {
    const newTheme = value as 'light' | 'dark' | 'system'
    const newPreferences = {
      ...preferences,
      themeMode: newTheme,
    }
    setPreferences(newPreferences)
    savePreferences(newPreferences)

    // Apply theme immediately
    if (newTheme !== 'system') {
      setTheme(newTheme)
    } else if (typeof window !== 'undefined') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
    }
  }

  const handleFontSizeChange = (value: string) => {
    const newPreferences = {
      ...preferences,
      fontSize: value as 'small' | 'medium' | 'large',
    }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const handleCompactModeToggle = (checked: boolean) => {
    const newPreferences = {
      ...preferences,
      compactMode: checked,
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
        .update({ appearance_preferences: defaultPreferences })
        .eq('id', userId)

      if (error) {
        console.error('Error resetting appearance preferences:', error)
        const errorMessage = error.message || 'Failed to reset appearance preferences'
        toast.error(errorMessage)
      } else {
        toast.success('Appearance preferences reset to defaults!')
        // Apply default theme
        if (defaultPreferences.themeMode !== 'system') {
          setTheme(defaultPreferences.themeMode)
        }
      }
    } catch (error: any) {
      console.error('Error resetting appearance preferences (catch):', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
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

      {/* Theme Mode */}
      <div className="p-3 sm:p-4 rounded-lg border-2 border-border hover:bg-accent/50 transition-all duration-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-2.5">
          <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <Label htmlFor="themeMode" className="text-sm sm:text-base md:text-lg font-semibold text-foreground font-sans">
            Theme Mode
          </Label>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed mb-3 sm:mb-3.5 pl-6 sm:pl-8">
          Choose your preferred color theme
        </p>
        <div className="pl-6 sm:pl-8">
          <Select
            value={preferences.themeMode || 'system'}
            onValueChange={handleThemeChange}
            disabled={isSaving}
          >
            <SelectTrigger className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px] w-full sm:w-auto sm:min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Font Size */}
      <div className="p-3 sm:p-4 rounded-lg border-2 border-border hover:bg-accent/50 transition-all duration-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-2.5">
          <Type className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <Label htmlFor="fontSize" className="text-sm sm:text-base md:text-lg font-semibold text-foreground font-sans">
            Font Size
          </Label>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed mb-3 sm:mb-3.5 pl-6 sm:pl-8">
          Adjust the default font size for better readability
        </p>
        <div className="pl-6 sm:pl-8">
          <Select
            value={preferences.fontSize || 'medium'}
            onValueChange={handleFontSizeChange}
            disabled={isSaving}
          >
            <SelectTrigger className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px] w-full sm:w-auto sm:min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Compact Mode */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 border-border hover:bg-accent/50 transition-all duration-200">
        <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Layout className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <Label htmlFor="compactMode" className="text-sm sm:text-base md:text-lg font-semibold text-foreground cursor-pointer font-sans break-words">
              Compact Mode
            </Label>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed pl-6 sm:pl-8">
            Use a more compact layout for dashboard and cards
          </p>
        </div>
        <Switch
          id="compactMode"
          checked={preferences.compactMode ?? false}
          onCheckedChange={handleCompactModeToggle}
          disabled={isSaving}
          className="flex-shrink-0 ml-3 sm:ml-4"
        />
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

