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
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
      <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
          <span className="truncate">Peer Comparison</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans mt-1 sm:mt-1.5 md:mt-2">
          See how you rank among all students
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Percentile Visualization */}
        <div className="space-y-3 sm:space-y-4 md:space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground font-sans">
              Your Position
            </span>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
              <span className="text-base sm:text-lg md:text-xl font-bold text-primary font-sans">
                {percentileLabel}
              </span>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-2.5">
            <Progress value={percentile} className="h-3 sm:h-4 md:h-5" />
            <div className="flex items-center justify-between text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {userGlobalRank > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 pt-2 sm:pt-3">
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-lg bg-background border-2 border-border hover:border-primary/50 transition-all duration-200">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary font-sans mb-1 sm:mb-2">
                  {userGlobalRank}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans">Your Rank</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-lg bg-background border-2 border-border hover:border-primary/50 transition-all duration-200">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary font-sans mb-1 sm:mb-2">
                  {totalUsers}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans">Total Students</div>
              </div>
            </div>
          )}
        </div>

        {/* Position Context */}
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground font-sans">
              Position Context
            </span>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
            {getPositionContext()}
          </p>
        </div>

        {/* Peer Insights */}
        {userGlobalRank > 0 && (
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 md:p-6 rounded-lg bg-background border-2 border-border hover:border-primary/50 transition-all duration-200">
            <h4 className="text-sm sm:text-base md:text-lg font-bold text-foreground mb-3 sm:mb-4 font-sans">
              Peer Insights
            </h4>
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm md:text-base font-sans">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">You're ahead of</span>
                <span className="font-semibold text-foreground">
                  {usersBehind} student{usersBehind !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Students ahead of you</span>
                <span className="font-semibold text-foreground">
                  {usersAhead} student{usersAhead !== 1 ? 's' : ''}
                </span>
              </div>
              {avgScore > 0 && (
                <div className="flex items-center justify-between gap-2">
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
        <div className="p-4 sm:p-5 md:p-6 rounded-lg bg-primary/10 border-2 border-primary/20 hover:border-primary/50 transition-all duration-200">
          <p className="text-xs sm:text-sm md:text-base font-semibold text-foreground text-center leading-relaxed font-sans">
            {getMotivationalMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

