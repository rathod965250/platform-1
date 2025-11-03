'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Award, Lock, TrendingUp } from 'lucide-react'
import { getAchievements, getNextAchievement } from '@/lib/dashboard/motivational-calculations'

interface AchievementBadgesProps {
  totalQuestionsAnswered: number
  totalTests: number
  avgScore: number
  currentStreak: number
}

export function AchievementBadges({
  totalQuestionsAnswered,
  totalTests,
  avgScore,
  currentStreak,
}: AchievementBadgesProps) {
  const achievements = getAchievements(
    totalQuestionsAnswered,
    totalTests,
    avgScore,
    currentStreak
  )

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const nextAchievement = getNextAchievement(achievements)

  // Get recent achievements (last 5 unlocked)
  const recentAchievements = unlockedAchievements.slice(-5).reverse()

  return (
    <div className="space-y-6">
      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              {unlockedAchievements.length} achievement{unlockedAchievements.length !== 1 ? 's' : ''} unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  title={achievement.description}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="text-xs font-medium text-foreground text-center">
                    {achievement.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Achievement Preview */}
      {nextAchievement && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Next Achievement
            </CardTitle>
            <CardDescription>
              You're close to unlocking this!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl opacity-50">
                  {nextAchievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {nextAchievement.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {nextAchievement.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        {nextAchievement.progress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={nextAchievement.progress} className="h-2" />
                  </div>
                </div>
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Achievement Collection</CardTitle>
          <CardDescription>
            Track your progress across all achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.slice(0, 8).map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  achievement.unlocked
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <p className={`font-medium ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {achievement.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {achievement.unlocked ? (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Unlocked
                    </Badge>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress.toFixed(0)}%
                      </span>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

