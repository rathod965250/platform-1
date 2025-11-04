'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RotateCcw, Loader2 } from 'lucide-react'

interface DashboardPreferences {
  showRankCards?: boolean
  showProgressTracking?: boolean
  showAchievementBadges?: boolean
  showImprovementTrends?: boolean
  showPeerComparison?: boolean
  showRecommendations?: boolean
  showPerformanceTrend?: boolean
  showWeakAreas?: boolean
}

const defaultPreferences: DashboardPreferences = {
  showRankCards: true,
  showProgressTracking: true,
  showAchievementBadges: true,
  showImprovementTrends: true,
  showPeerComparison: true,
  showRecommendations: true,
  showPerformanceTrend: true,
  showWeakAreas: true,
}

interface DashboardPreferencesProps {
  userId: string
  currentPreferences: DashboardPreferences | null
}

export function DashboardPreferences({
  userId,
  currentPreferences,
}: DashboardPreferencesProps) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => ({
    ...defaultPreferences,
    ...(currentPreferences || {}),
  }))
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function
  const savePreferences = useCallback(async (newPreferences: DashboardPreferences) => {
    // Validate userId
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

        // Update preferences - use rpc or direct update
        const { error } = await supabase
          .from('profiles')
          .update({ dashboard_preferences: newPreferences })
          .eq('id', userId)

        if (error) {
          // Log full error details - capture all possible properties
          const errorAny = error as any
          const errorInfo: any = {
            error: error,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            errorString: String(error),
            errorMessage: errorAny?.message,
            errorDetails: errorAny?.details,
            errorHint: errorAny?.hint,
            errorCode: errorAny?.code,
            errorStatus: errorAny?.status,
            errorStatusText: errorAny?.statusText,
            errorResponse: errorAny?.response,
            errorRequest: errorAny?.request,
            userId,
            preferences: JSON.stringify(newPreferences)
          }
          
          // Try to get all enumerable properties
          try {
            Object.keys(error || {}).forEach(key => {
              errorInfo[`error_${key}`] = (error as any)[key]
            })
          } catch (e) {
            // Ignore if we can't enumerate
          }
          
          console.error('Error saving preferences - Full details:', errorInfo)
          
          // Extract error message with better handling
          let errorMessage = 'Failed to save preferences. Please try again.'
          
          // Try to get error message from various properties
          if (errorAny?.message && typeof errorAny.message === 'string' && errorAny.message.trim().length > 0) {
            errorMessage = errorAny.message.trim()
          } else if (errorAny?.details && typeof errorAny.details === 'string' && errorAny.details.trim().length > 0) {
            errorMessage = errorAny.details.trim()
          } else if (errorAny?.hint && typeof errorAny.hint === 'string' && errorAny.hint.trim().length > 0) {
            errorMessage = errorAny.hint.trim()
          } else if (errorAny?.code) {
            // Handle specific error codes
            if (errorAny.code === 'PGRST116') {
              errorMessage = 'Profile not found. Please refresh the page.'
            } else if (errorAny.code === '42501') {
              errorMessage = 'Permission denied. Please run the SQL fix in APPLY_RLS_FIX_FOR_DASHBOARD_PREFERENCES.sql to fix the RLS policy.'
            } else if (errorAny.code === 'PGRST301') {
              errorMessage = 'Multiple rows returned. Please contact support.'
            } else {
              errorMessage = `Database error (${errorAny.code}). Please check console for details or try running the SQL fix.`
            }
          } else if (errorAny?.status || errorAny?.statusText) {
            // Handle HTTP errors
            errorMessage = `Server error (${errorAny.status || 'unknown'}): ${errorAny.statusText || 'Unknown error'}. Please try again.`
          } else {
            // If error is empty object or unhelpful, provide a more actionable message
            const errorString = String(error)
            if (errorString === '[object Object]' || errorString === '{}') {
              errorMessage = 'An unknown error occurred. Please check your database connection and RLS policies. Run the SQL fix in APPLY_RLS_FIX_FOR_DASHBOARD_PREFERENCES.sql if the issue persists.'
            } else if (errorString.trim().length > 0 && errorString !== '[object Object]') {
              errorMessage = errorString
            }
          }
          
          toast.error(errorMessage)
        } else {
          toast.success('Preferences saved successfully!')
        }
      } catch (error: any) {
        // Log full error for debugging
        console.error('Error saving preferences (catch):', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
          error: error
        })
        
        // Handle different error types
        let errorMessage = 'An unexpected error occurred. Please try again.'
        
        if (error?.message) {
          errorMessage = error.message
        } else if (typeof error === 'string') {
          errorMessage = error
        } else if (error?.toString && error.toString() !== '[object Object]') {
          errorMessage = error.toString()
        }
        
        toast.error(errorMessage)
      } finally {
        setIsSaving(false)
        saveTimeoutRef.current = null
      }
    }, 500) // 500ms debounce
  }, [userId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [])

  const handleToggle = (key: keyof DashboardPreferences, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const handleReset = async () => {
    // Validate userId
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

      // Update preferences - simplified query
      const { data, error } = await supabase
        .from('profiles')
        .update({ dashboard_preferences: defaultPreferences })
        .eq('id', userId)

      if (error) {
        // Log error for debugging
        console.error('Error resetting preferences:', error)
        
        // Extract error message
        let errorMessage = 'Failed to reset preferences. Please try again.'
        const errorAny = error as any
        
        if (errorAny?.message) {
          errorMessage = errorAny.message
        } else if (errorAny?.details) {
          errorMessage = errorAny.details
        } else if (errorAny?.hint) {
          errorMessage = errorAny.hint
        } else if (errorAny?.code) {
          if (errorAny.code === 'PGRST116') {
            errorMessage = 'Profile not found. Please refresh the page.'
          } else if (errorAny.code === '42501') {
            errorMessage = 'Permission denied. Please check your account settings.'
          } else {
            errorMessage = `Error ${errorAny.code}. Please try again.`
          }
        }
        
        toast.error(errorMessage)
      } else {
        toast.success('Preferences reset to defaults!')
      }
    } catch (error: any) {
      // Log full error for debugging
      console.error('Error resetting preferences (catch):', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error: error
      })
      
      // Handle different error types
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString()
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const preferenceLabels: Record<keyof DashboardPreferences, { label: string; description: string }> = {
    showRankCards: {
      label: 'Show Rank Cards',
      description: 'Display your leaderboard ranks (Global, Weekly, Monthly)',
    },
    showProgressTracking: {
      label: 'Show Progress Tracking',
      description: 'Display weekly goals and milestone progress',
    },
    showAchievementBadges: {
      label: 'Show Achievement Badges',
      description: 'Display unlocked achievements and badge collection',
    },
    showImprovementTrends: {
      label: 'Show Improvement Trends',
      description: 'Display week-over-week improvements and best scores',
    },
    showPeerComparison: {
      label: 'Show Peer Comparison',
      description: 'Display percentile position and peer insights',
    },
    showRecommendations: {
      label: 'Show Recommendations',
      description: 'Display personalized action recommendations',
    },
    showPerformanceTrend: {
      label: 'Show Performance Trend Chart',
      description: 'Display performance trend chart over time',
    },
    showWeakAreas: {
      label: 'Show Weak Areas Alert',
      description: 'Display areas needing attention and improvement',
    },
  }

  return (
    <div className="space-y-6">
      {/* Save Indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving preferences...</span>
        </div>
      )}

      {/* Preferences Toggles */}
      <div className="space-y-4">
        {Object.entries(preferenceLabels).map(([key, { label, description }]) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor={key} className="text-base font-medium text-foreground cursor-pointer">
                {label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <Switch
              id={key}
              checked={preferences[key as keyof DashboardPreferences] ?? true}
              onCheckedChange={(checked) =>
                handleToggle(key as keyof DashboardPreferences, checked)
              }
              disabled={isSaving}
            />
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}

