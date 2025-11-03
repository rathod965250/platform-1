'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Calculator, BookOpen, BarChart3, Lightbulb, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PracticeCategoryCardProps {
  category: {
    id: string
    name: string
    description?: string | null
    subcategories?: Array<{ count?: number }> | null
  }
  iconName: string
  adaptiveState?: {
    mastery_score: number | string
    current_difficulty: 'easy' | 'medium' | 'hard'
    recent_accuracy?: number[] | null
    avg_time_seconds?: number | null
  } | null
  totalQuestions?: number
  categoryAccuracy?: number
  lastPracticeDate?: string | null
}

export function PracticeCategoryCard({
  category,
  iconName,
  adaptiveState,
  totalQuestions = 0,
  categoryAccuracy = 0,
  lastPracticeDate,
}: PracticeCategoryCardProps) {
  // Map icon names to icon components
  const iconMap: Record<string, LucideIcon> = {
    'Calculator': Calculator,
    'Brain': Brain,
    'BookOpen': BookOpen,
    'BarChart3': BarChart3,
    'Lightbulb': Lightbulb,
  }
  
  const Icon = iconMap[iconName] || Brain

  // Calculate mastery score (0-100%)
  const masteryScore = adaptiveState
    ? typeof adaptiveState.mastery_score === 'number'
      ? adaptiveState.mastery_score
      : parseFloat(String(adaptiveState.mastery_score || 0))
    : 0

  const masteryPercentage = masteryScore * 100
  const currentDifficulty = adaptiveState?.current_difficulty || undefined

  // Calculate recent accuracy
  const recentAccuracy = adaptiveState?.recent_accuracy || []
  const recentAccuracyAvg = recentAccuracy.length > 0
    ? recentAccuracy.reduce((sum, acc) => sum + parseFloat(String(acc || 0)), 0) / recentAccuracy.length
    : 0

  // Format average time
  const avgTime = adaptiveState?.avg_time_seconds || 0
  const avgTimeFormatted = avgTime > 0
    ? avgTime < 60
      ? `${avgTime}s`
      : `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`
    : '—'

  const hasProgress = adaptiveState !== null

  return (
    <Card className="group hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {category.subcategories?.[0]?.count || 0} topics
          </Badge>
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">
          {category.name}
        </h3>
        
        {category.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Mastery Progress */}
        {hasProgress && (
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Mastery Score</span>
                <span className="font-semibold text-foreground">{masteryPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={masteryPercentage} className="h-2" />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {recentAccuracyAvg > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{recentAccuracyAvg.toFixed(0)}%</span> recent accuracy
                </div>
              )}
              
              {avgTime > 0 && (
                <div className="text-xs text-muted-foreground">
                  Avg: <span className="font-medium">{avgTimeFormatted}</span>
                </div>
              )}
            </div>

            {totalQuestions > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{totalQuestions}</span> question{totalQuestions !== 1 ? 's' : ''} answered
              </div>
            )}
          </div>
        )}

        {/* No Progress State */}
        {!hasProgress && (
          <div className="mb-4 py-3 px-4 rounded-lg bg-muted/50 border border-dashed">
            <p className="text-sm text-muted-foreground text-center">
              Start practicing to see your progress
            </p>
          </div>
        )}

        <Button
          asChild
          className={cn(
            'w-full',
            hasProgress ? '' : 'bg-primary hover:bg-primary/90'
          )}
          variant={hasProgress ? 'default' : 'default'}
        >
          <Link href={`/practice/configure/${category.id}`}>
            Take Test
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

