'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target, Trophy, TrendingUp } from 'lucide-react'
import { getProgressMotivationalMessage } from '@/lib/dashboard/motivational-calculations'

interface ProgressTrackingProps {
  totalQuestionsAnswered: number
  totalTests: number
  currentStreak: number
  progressToNextMilestone: {
    current: number
    target: number
    percentage: number
    label: string
  }
}

export function ProgressTracking({
  totalQuestionsAnswered,
  totalTests,
  currentStreak,
  progressToNextMilestone,
}: ProgressTrackingProps) {
  // Calculate weekly goal (assuming 50 questions per week target)
  const weeklyTarget = 50
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()) // Start of week
  const weekProgress = Math.min((totalQuestionsAnswered / weeklyTarget) * 100, 100)

  // Calculate test milestone progress
  const nextTestMilestone = [5, 10, 25, 50, 100].find(m => m > totalTests) || 100
  const testProgress = Math.min((totalTests / nextTestMilestone) * 100, 100)

  // Calculate streak milestone progress
  const nextStreakMilestone = [3, 7, 14, 30].find(m => m > currentStreak) || 30
  const streakProgress = Math.min((currentStreak / nextStreakMilestone) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Weekly Goal Progress */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Goal
          </CardTitle>
          <CardDescription>
            Target: {weeklyTarget} questions this week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {totalQuestionsAnswered} / {weeklyTarget} questions
              </span>
              <span className="text-sm text-muted-foreground">
                {weekProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={weekProgress} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            {getProgressMotivationalMessage(weekProgress, 'Weekly goal')}
          </p>
        </CardContent>
      </Card>

      {/* Milestone Tracker */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Next Milestone
          </CardTitle>
          <CardDescription>
            {progressToNextMilestone.label}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {progressToNextMilestone.current} / {progressToNextMilestone.target}
              </span>
              <span className="text-sm text-muted-foreground">
                {progressToNextMilestone.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={progressToNextMilestone.percentage} className="h-2" />
          </div>
          {progressToNextMilestone.target - progressToNextMilestone.current > 0 && (
            <p className="text-sm text-muted-foreground">
              Only {progressToNextMilestone.target - progressToNextMilestone.current} more questions to reach your milestone! 🎯
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test and Streak Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Test Progress</span>
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {totalTests} / {nextTestMilestone}
                </span>
                <span className="text-sm text-muted-foreground">
                  {testProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Streak Progress</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {currentStreak} / {nextStreakMilestone} days
                </span>
                <span className="text-sm text-muted-foreground">
                  {streakProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={streakProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

