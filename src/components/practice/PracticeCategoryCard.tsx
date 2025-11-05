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
    <Card className="group bg-card border-2 border-border hover:border-primary/50 hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans">
            {category.subcategories?.[0]?.count || 0} topics
          </Badge>
        </div>

        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans break-words">
          {category.name}
        </h3>
        
        {category.description && (
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4 font-sans leading-relaxed line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Mastery Progress */}
        {hasProgress && (
          <div className="space-y-2.5 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4">
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm md:text-base mb-2 sm:mb-2.5 font-sans">
                <span className="text-muted-foreground font-medium">Mastery Score</span>
                <span className="font-bold text-foreground">{masteryPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={masteryPercentage} className="h-2 sm:h-2.5 md:h-3" />
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {recentAccuracyAvg > 0 && (
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                  <span className="font-semibold">{recentAccuracyAvg.toFixed(0)}%</span> recent accuracy
                </div>
              )}
              
              {avgTime > 0 && (
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                  Avg: <span className="font-semibold">{avgTimeFormatted}</span>
                </div>
              )}
            </div>

            {totalQuestions > 0 && (
              <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                <span className="font-semibold">{totalQuestions}</span> question{totalQuestions !== 1 ? 's' : ''} answered
              </div>
            )}
          </div>
        )}

        {/* No Progress State */}
        {!hasProgress && (
          <div className="mb-3 sm:mb-4 py-3 sm:py-3.5 md:py-4 px-3 sm:px-4 md:px-5 rounded-lg bg-muted/50 border-2 border-dashed border-border">
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground text-center font-sans leading-relaxed">
              Start practicing to see your progress
            </p>
          </div>
        )}

        <Button
          asChild
          className={cn(
            'w-full text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] shadow-md hover:shadow-lg transition-all duration-200',
            hasProgress ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
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

