'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Debounced save function
  const savePreferences = useCallback(async (newPreferences: DashboardPreferences) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const timeout = setTimeout(async () => {
      setIsSaving(true)
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('profiles')
          .update({ dashboard_preferences: newPreferences })
          .eq('id', userId)

        if (error) {
          console.error('Error saving preferences:', error)
          toast.error('Failed to save preferences. Please try again.')
        } else {
          toast.success('Preferences saved successfully!')
        }
      } catch (error) {
        console.error('Error saving preferences:', error)
        toast.error('An unexpected error occurred.')
      } finally {
        setIsSaving(false)
      }
    }, 500) // 500ms debounce

    setSaveTimeout(timeout)
  }, [userId, saveTimeout])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  const handleToggle = (key: keyof DashboardPreferences, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const handleReset = async () => {
    setPreferences(defaultPreferences)
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ dashboard_preferences: defaultPreferences })
        .eq('id', userId)

      if (error) {
        console.error('Error resetting preferences:', error)
        toast.error('Failed to reset preferences. Please try again.')
      } else {
        toast.success('Preferences reset to defaults!')
      }
    } catch (error) {
      console.error('Error resetting preferences:', error)
      toast.error('An unexpected error occurred.')
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

