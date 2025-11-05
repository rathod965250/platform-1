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
    <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full">
      <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
          <span className="truncate">Improvement Trends</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans mt-1 sm:mt-1.5 md:mt-2">
          Your performance highlights and progress
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
          {/* Week-over-Week Improvement */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground truncate font-sans">
                This Week's Improvement
              </span>
              <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg ${improvementBg} flex-shrink-0`}>
                <ImprovementIcon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${improvementColor}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${improvementColor} break-all font-sans`}>
                {isImproving ? '+' : ''}{weekOverWeekImprovement.toFixed(1)}%
              </span>
              <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap font-sans">
                vs last week
              </span>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
              {isImproving
                ? "Great job! You're improving! Keep it up!"
                : weekOverWeekImprovement === 0
                ? "Maintain your consistency to see improvement!"
                : "Keep practicing to bounce back!"}
            </p>
          </div>

          {/* Best Score */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground truncate font-sans">
                Best Score
              </span>
              <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-all font-sans">
                {bestScore.toFixed(1)}%
              </span>
              <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap font-sans">
                all-time
              </span>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
              {bestScore >= avgScore
                ? "Your best performance! Aim to beat it!"
                : "Try to match or beat your best score!"}
            </p>
          </div>

          {/* Current Average Score */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground truncate font-sans">
                Current Average
              </span>
              <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-all font-sans">
                {avgScore.toFixed(1)}%
              </span>
              <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap font-sans">
                overall
              </span>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
              {avgScore >= 70
                ? "Excellent average! Keep maintaining it!"
                : avgScore >= 50
                ? "Good progress! Aim for 70%+"
                : "Keep practicing to improve your average!"}
            </p>
          </div>

          {/* Streak Information */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground truncate font-sans">
                Streak Records
              </span>
              <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-sans">
                  {currentStreak}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-muted-foreground whitespace-nowrap font-sans">
                  current days
                </span>
              </div>
              {longestStreak > currentStreak && (
                <div>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground font-sans">
                    Best: {longestStreak} days
                  </span>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 leading-relaxed font-sans">
                    You're {longestStreak - currentStreak} days away from matching your record!
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
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

