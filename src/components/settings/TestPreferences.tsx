'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RotateCcw, Loader2, Timer, CheckCircle2, Eye, BookOpen, Camera } from 'lucide-react'

interface TestPreferences {
  autoSubmitOnTimeExpiry?: boolean
  showCorrectAnswersImmediately?: boolean
  defaultDifficulty?: 'easy' | 'medium' | 'hard'
  enableQuestionReviewMode?: boolean
  enableCameraProctoring?: boolean
}

const defaultPreferences: TestPreferences = {
  autoSubmitOnTimeExpiry: true,
  showCorrectAnswersImmediately: false,
  defaultDifficulty: 'medium',
  enableQuestionReviewMode: true,
  enableCameraProctoring: false,
}

interface TestPreferencesProps {
  userId: string
  currentPreferences: TestPreferences | null
}

export function TestPreferences({
  userId,
  currentPreferences,
}: TestPreferencesProps) {
  const [preferences, setPreferences] = useState<TestPreferences>(() => ({
    ...defaultPreferences,
    ...(currentPreferences || {}),
  }))
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function
  const savePreferences = useCallback(async (newPreferences: TestPreferences) => {
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
          .update({ test_preferences: newPreferences })
          .eq('id', userId)

        if (error) {
          console.error('Error updating test preferences:', error)
          const errorMessage = error.message || 'Failed to update test preferences'
          toast.error(errorMessage)
        } else {
          toast.success('Test preferences updated!')
        }
      } catch (error: any) {
        console.error('Error updating test preferences (catch):', error)
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

  const handleToggle = (key: keyof TestPreferences, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const handleDifficultyChange = (value: string) => {
    const newPreferences = {
      ...preferences,
      defaultDifficulty: value as 'easy' | 'medium' | 'hard',
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
        .update({ test_preferences: defaultPreferences })
        .eq('id', userId)

      if (error) {
        console.error('Error resetting test preferences:', error)
        const errorMessage = error.message || 'Failed to reset test preferences'
        toast.error(errorMessage)
      } else {
        toast.success('Test preferences reset to defaults!')
      }
    } catch (error: any) {
      console.error('Error resetting test preferences (catch):', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const preferenceLabels: Record<keyof Omit<TestPreferences, 'defaultDifficulty'>, { label: string; description: string; icon: React.ElementType }> = {
    autoSubmitOnTimeExpiry: {
      label: 'Auto-Submit on Time Expiry',
      description: 'Automatically submit test when time runs out',
      icon: Timer,
    },
    showCorrectAnswersImmediately: {
      label: 'Show Correct Answers Immediately',
      description: 'Display correct answers right after submitting each question',
      icon: CheckCircle2,
    },
    enableQuestionReviewMode: {
      label: 'Enable Question Review Mode',
      description: 'Allow reviewing and changing answers before submission',
      icon: BookOpen,
    },
    enableCameraProctoring: {
      label: 'Enable Camera Proctoring',
      description: 'Use camera for test monitoring and security (camera will be active throughout the test)',
      icon: Camera,
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
              checked={typeof preferences[key as keyof TestPreferences] === 'boolean' ? preferences[key as keyof TestPreferences] as boolean : false}
              onCheckedChange={(checked) =>
                handleToggle(key as keyof TestPreferences, checked)
              }
              disabled={isSaving}
              className="flex-shrink-0 ml-3 sm:ml-4"
            />
          </div>
        ))}

        {/* Default Difficulty Selector */}
        <div className="p-3 sm:p-4 rounded-lg border-2 border-border hover:bg-accent/50 transition-all duration-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-2.5">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <Label htmlFor="defaultDifficulty" className="text-sm sm:text-base md:text-lg font-semibold text-foreground font-sans">
              Default Test Difficulty
            </Label>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed mb-3 sm:mb-3.5 pl-6 sm:pl-8">
            Choose the default difficulty level for new tests
          </p>
          <div className="pl-6 sm:pl-8">
            <Select
              value={preferences.defaultDifficulty || 'medium'}
              onValueChange={handleDifficultyChange}
              disabled={isSaving}
            >
              <SelectTrigger className="text-xs sm:text-sm md:text-base font-sans min-h-[44px] sm:min-h-[48px] w-full sm:w-auto sm:min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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

