'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, TrendingUp, Target } from 'lucide-react'
import { calculatePercentile, getPercentileLabel } from '@/lib/dashboard/motivational-calculations'

interface PeerComparisonProps {
  userGlobalRank: number
  totalUsers: number
  avgScore: number
}

export function PeerComparison({
  userGlobalRank,
  totalUsers,
  avgScore,
}: PeerComparisonProps) {
  const percentile = userGlobalRank > 0 && totalUsers > 0
    ? calculatePercentile(userGlobalRank, totalUsers)
    : 0

  const percentileLabel = getPercentileLabel(percentile)
  const usersBehind = userGlobalRank > 0 ? totalUsers - userGlobalRank : 0
  const usersAhead = userGlobalRank > 0 ? userGlobalRank - 1 : totalUsers

  // Calculate position context
  const getPositionContext = () => {
    if (userGlobalRank === 0) return "Take your first test to see your position!"
    if (userGlobalRank === 1) return "🏆 You're #1! Amazing achievement!"
    if (userGlobalRank <= 10) {
      const nextRank = userGlobalRank - 1
      return nextRank === 0 
        ? "You're at the top! Incredible!"
        : `${nextRank} rank${nextRank === 1 ? '' : 's'} away from #1`
    }
    if (userGlobalRank <= 50) {
      const nextMilestone = Math.floor(userGlobalRank / 10) * 10
      return `${userGlobalRank - nextMilestone} ranks away from top ${nextMilestone}`
    }
    return "Keep practicing to climb the ranks!"
  }

  // Get motivational message based on percentile
  const getMotivationalMessage = () => {
    if (percentile >= 90) return "🌟 Outstanding! You're in the elite tier!"
    if (percentile >= 75) return "🎯 Excellent work! You're ahead of most students!"
    if (percentile >= 50) return "💪 Good progress! You're above average!"
    if (percentile >= 25) return "📈 Keep practicing! You're making progress!"
    return "🚀 Start your journey! Every expert was once a beginner!"
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Peer Comparison
        </CardTitle>
        <CardDescription>
          See how you rank among all students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Percentile Visualization */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Your Position
            </span>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">
                {percentileLabel}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={percentile} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {userGlobalRank > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <div className="text-2xl font-bold text-primary">{userGlobalRank}</div>
                <div className="text-xs text-muted-foreground mt-1">Your Rank</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <div className="text-2xl font-bold text-primary">{totalUsers}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Students</div>
              </div>
            </div>
          )}
        </div>

        {/* Position Context */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Position Context
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getPositionContext()}
          </p>
        </div>

        {/* Peer Insights */}
        {userGlobalRank > 0 && (
          <div className="space-y-3 p-4 rounded-lg bg-background border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Peer Insights
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">You're ahead of</span>
                <span className="font-semibold text-foreground">
                  {usersBehind} student{usersBehind !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Students ahead of you</span>
                <span className="font-semibold text-foreground">
                  {usersAhead} student{usersAhead !== 1 ? 's' : ''}
                </span>
              </div>
              {avgScore > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your average score</span>
                  <span className="font-semibold text-foreground">
                    {avgScore.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-foreground text-center">
            {getMotivationalMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

