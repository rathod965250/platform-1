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
  const improvementIcon = isImproving ? TrendingUp : TrendingDown
  const improvementColor = isImproving ? 'text-green-600' : 'text-red-600'
  const improvementBg = isImproving ? 'bg-green-500/10' : 'bg-red-500/10'

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Improvement Trends
        </CardTitle>
        <CardDescription>
          Your performance highlights and progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Week-over-Week Improvement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                This Week's Improvement
              </span>
              <div className={`p-2 rounded-lg ${improvementBg}`}>
                <improvementIcon className={`h-4 w-4 ${improvementColor}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${improvementColor}`}>
                {isImproving ? '+' : ''}{weekOverWeekImprovement.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                vs last week
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isImproving
                ? "Great job! You're improving! Keep it up!"
                : weekOverWeekImprovement === 0
                ? "Maintain your consistency to see improvement!"
                : "Keep practicing to bounce back!"}
            </p>
          </div>

          {/* Best Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Best Score
              </span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {bestScore.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                all-time
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {bestScore >= avgScore
                ? "Your best performance! Aim to beat it!"
                : "Try to match or beat your best score!"}
            </p>
          </div>

          {/* Current Average Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Current Average
              </span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {avgScore.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                overall
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {avgScore >= 70
                ? "Excellent average! Keep maintaining it!"
                : avgScore >= 50
                ? "Good progress! Aim for 70%+"
                : "Keep practicing to improve your average!"}
            </p>
          </div>

          {/* Streak Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Streak Records
              </span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Flame className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {currentStreak}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  current days
                </span>
              </div>
              {longestStreak > currentStreak && (
                <div>
                  <span className="text-lg font-semibold text-foreground">
                    Best: {longestStreak} days
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're {longestStreak - currentStreak} days away from matching your record!
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
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

