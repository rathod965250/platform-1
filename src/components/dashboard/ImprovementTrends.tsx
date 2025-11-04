'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Trophy, Flame } from 'lucide-react'

interface ImprovementTrendsProps {
  weekOverWeekImprovement: number
  bestScore: number
  longestStreak: number
  avgScore: number
  currentStreak: number
}

export function ImprovementTrends({
  weekOverWeekImprovement,
  bestScore,
  longestStreak,
  avgScore,
  currentStreak,
}: ImprovementTrendsProps) {
  const isImproving = weekOverWeekImprovement > 0
  const ImprovementIcon = isImproving ? TrendingUp : TrendingDown
  const improvementColor = isImproving ? 'text-green-600' : 'text-red-600'
  const improvementBg = isImproving ? 'bg-green-500/10' : 'bg-red-500/10'

  return (
    <Card className="bg-card border-border w-full">
      <CardHeader className="px-3 sm:px-4 md:px-5 pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          <span className="truncate">Improvement Trends</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Your performance highlights and progress
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4">
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
          {/* Week-over-Week Improvement */}
          <div className="space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 md:p-3.5 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                This Week's Improvement
              </span>
              <div className={`p-1 sm:p-1.5 rounded-lg ${improvementBg} flex-shrink-0`}>
                <ImprovementIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${improvementColor}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className={`text-lg sm:text-xl md:text-2xl font-bold ${improvementColor} break-all`}>
                {isImproving ? '+' : ''}{weekOverWeekImprovement.toFixed(1)}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                vs last week
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isImproving
                ? "Great job! You're improving! Keep it up!"
                : weekOverWeekImprovement === 0
                ? "Maintain your consistency to see improvement!"
                : "Keep practicing to bounce back!"}
            </p>
          </div>

          {/* Best Score */}
          <div className="space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 md:p-3.5 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Best Score
              </span>
              <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-all">
                {bestScore.toFixed(1)}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                all-time
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {bestScore >= avgScore
                ? "Your best performance! Aim to beat it!"
                : "Try to match or beat your best score!"}
            </p>
          </div>

          {/* Current Average Score */}
          <div className="space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 md:p-3.5 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Current Average
              </span>
              <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-all">
                {avgScore.toFixed(1)}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                overall
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {avgScore >= 70
                ? "Excellent average! Keep maintaining it!"
                : avgScore >= 50
                ? "Good progress! Aim for 70%+"
                : "Keep practicing to improve your average!"}
            </p>
          </div>

          {/* Streak Information */}
          <div className="space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 md:p-3.5 rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Streak Records
              </span>
              <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  {currentStreak}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  current days
                </span>
              </div>
              {longestStreak > currentStreak && (
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    Best: {longestStreak} days
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    You're {longestStreak - currentStreak} days away from matching your record!
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentStreak >= 7
                ? "🔥 Amazing streak! Keep it going!"
                : currentStreak > 0
                ? "Build your streak by practicing daily!"
                : "Start a streak by practicing today!"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

