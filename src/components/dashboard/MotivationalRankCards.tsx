'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, TrendingUp, Star } from 'lucide-react'
import { calculatePercentile, getPercentileLabel, getRankMotivationalMessage } from '@/lib/dashboard/motivational-calculations'

interface MotivationalRankCardsProps {
  userGlobalRank: number
  userWeeklyRank: number
  userMonthlyRank: number
  totalUsers: number
}

export function MotivationalRankCards({
  userGlobalRank,
  userWeeklyRank,
  userMonthlyRank,
  totalUsers,
}: MotivationalRankCardsProps) {
  const router = useRouter()

  const globalPercentile = userGlobalRank > 0 && totalUsers > 0
    ? calculatePercentile(userGlobalRank, totalUsers)
    : 0

  const weeklyPercentile = userWeeklyRank > 0 && totalUsers > 0
    ? calculatePercentile(userWeeklyRank, totalUsers)
    : 0

  const monthlyPercentile = userMonthlyRank > 0 && totalUsers > 0
    ? calculatePercentile(userMonthlyRank, totalUsers)
    : 0

  const handleCardClick = () => {
    router.push('/leaderboard')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Global Rank Card */}
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          userGlobalRank === 1
            ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border-yellow-500/50'
            : userGlobalRank <= 3
            ? 'bg-gradient-to-br from-gray-300/20 to-gray-400/20 border-gray-400/50'
            : userGlobalRank <= 10
            ? 'bg-gradient-to-br from-blue-400/20 to-blue-600/20 border-blue-500/50'
            : 'bg-card border-border'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              userGlobalRank === 1
                ? 'bg-yellow-500/20 text-yellow-600'
                : userGlobalRank <= 3
                ? 'bg-gray-400/20 text-gray-600'
                : userGlobalRank <= 10
                ? 'bg-blue-500/20 text-blue-600'
                : 'bg-primary/10 text-primary'
            }`}>
              <Trophy className="h-6 w-6" />
            </div>
            {userGlobalRank > 0 && (
              <div className={`text-2xl font-bold ${
                userGlobalRank === 1
                  ? 'text-yellow-600'
                  : userGlobalRank <= 3
                  ? 'text-gray-600'
                  : 'text-foreground'
              }`}>
                #{userGlobalRank}
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            All-Time Rank
          </h3>
          {userGlobalRank > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {getPercentileLabel(globalPercentile)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getRankMotivationalMessage(userGlobalRank, totalUsers)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Take your first test to see your rank!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Rank Card */}
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          userWeeklyRank > 0 && userWeeklyRank <= 10
            ? 'bg-gradient-to-br from-blue-400/20 to-blue-600/20 border-blue-500/50'
            : 'bg-card border-border'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              userWeeklyRank > 0 && userWeeklyRank <= 10
                ? 'bg-blue-500/20 text-blue-600'
                : 'bg-primary/10 text-primary'
            }`}>
              <TrendingUp className="h-6 w-6" />
            </div>
            {userWeeklyRank > 0 && (
              <div className="text-2xl font-bold text-foreground">
                #{userWeeklyRank}
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            This Week's Rank
          </h3>
          {userWeeklyRank > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {getPercentileLabel(weeklyPercentile)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getRankMotivationalMessage(userWeeklyRank, totalUsers)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No activity this week. Start practicing!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Rank Card */}
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          userMonthlyRank > 0 && userMonthlyRank <= 10
            ? 'bg-gradient-to-br from-purple-400/20 to-purple-600/20 border-purple-500/50'
            : 'bg-card border-border'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              userMonthlyRank > 0 && userMonthlyRank <= 10
                ? 'bg-purple-500/20 text-purple-600'
                : 'bg-primary/10 text-primary'
            }`}>
              <Star className="h-6 w-6" />
            </div>
            {userMonthlyRank > 0 && (
              <div className="text-2xl font-bold text-foreground">
                #{userMonthlyRank}
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            This Month's Rank
          </h3>
          {userMonthlyRank > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {getPercentileLabel(monthlyPercentile)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getRankMotivationalMessage(userMonthlyRank, totalUsers)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No activity this month. Be the first!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

