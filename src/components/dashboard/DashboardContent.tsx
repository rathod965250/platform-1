'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Brain,
  Calculator,
  ClipboardList,
  Target,
  TrendingUp,
  Trophy,
  Flame,
  Clock,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DashboardShell } from './DashboardShell'
import { MotivationalRankCards } from './MotivationalRankCards'
import { ProgressTracking } from './ProgressTracking'
import { AchievementBadges } from './AchievementBadges'
import { ImprovementTrends } from './ImprovementTrends'
import { PeerComparison } from './PeerComparison'

interface DashboardPreferences {
  showRankCards?: boolean
  showProgressTracking?: boolean
  showAchievementBadges?: boolean
  showImprovementTrends?: boolean
  showPeerComparison?: boolean
  showRecommendations?: boolean
  showPerformanceTrend?: boolean
  showWeakAreas?: boolean
}

interface DashboardContentProps {
  profile: any
  stats: {
    totalTests: number
    avgScore: number
    totalQuestionsAnswered: number
    currentStreak: number
  }
  recentActivity: Array<{
    type: 'test' | 'practice'
    id: string
    title: string
    date: string
    score: number
    totalMarks: number
    testId?: string
  }>
  performanceTrend: Array<{
    index: number
    score: string
    date: string
  }>
  weakAreas: string[]
  masteryLevels?: Record<string, number>
  adaptiveStates?: any[]
  userGlobalRank?: number
  userWeeklyRank?: number
  userMonthlyRank?: number
  totalUsers?: number
  weekOverWeekImprovement?: number
  bestScore?: number
  longestStreak?: number
  progressToNextMilestone?: {
    current: number
    target: number
    percentage: number
    label: string
  }
  dashboardPreferences?: DashboardPreferences
}

export function DashboardContent({
  profile,
  stats,
  recentActivity,
  performanceTrend,
  weakAreas,
  masteryLevels = {},
  adaptiveStates = [],
  userGlobalRank = 0,
  userWeeklyRank = 0,
  userMonthlyRank = 0,
  totalUsers = 0,
  weekOverWeekImprovement = 0,
  bestScore = 0,
  longestStreak = 0,
  progressToNextMilestone = { current: 0, target: 100, percentage: 0, label: '' },
  dashboardPreferences = {
    showRankCards: true,
    showProgressTracking: true,
    showAchievementBadges: true,
    showImprovementTrends: true,
    showPeerComparison: true,
    showRecommendations: true,
    showPerformanceTrend: true,
    showWeakAreas: true,
  },
}: DashboardContentProps) {
  const router = useRouter()

  // Get personalized greeting and name
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours()
    let timeGreeting = ''
    
    if (hour < 12) {
      timeGreeting = 'Good morning'
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon'
    } else {
      timeGreeting = 'Good evening'
    }

    // Get the student's name with fallbacks
    let studentName = ''
    if (profile?.full_name) {
      // Use first and second name (first name + last name) for personalized greeting
      const nameParts = profile.full_name.trim().split(/\s+/)
      if (nameParts.length >= 2) {
        // Combine first and second name (e.g., "John Sara")
        studentName = `${nameParts[0]} ${nameParts[1]}`
      } else if (nameParts.length === 1) {
        // If only one name exists, use it
        studentName = nameParts[0]
      } else {
        studentName = profile.full_name
      }
    } else if (profile?.email) {
      // Fallback to email username if name is not available
      studentName = profile.email.split('@')[0]
    } else {
      studentName = 'Student'
    }

    return { timeGreeting, studentName }
  }

  const { timeGreeting, studentName } = getPersonalizedGreeting()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      if (diffInHours < 1) return 'Just now'
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getRecommendations = () => {
    const recommendations = []

    if (weakAreas.length > 0) {
      // Find category ID for the weak area
      const weakCategory = adaptiveStates?.find(
        (state: any) => state.category?.name === weakAreas[0]
      )
      const categoryId = weakCategory?.category_id || ''
      
      recommendations.push({
        title: `Practice ${weakAreas[0]}`,
        description: `Your accuracy in ${weakAreas[0]} is below 60%. Use adaptive practice to improve.`,
        action: 'Start Practice',
        href: categoryId ? `/practice/configure/${categoryId}` : '/practice',
        icon: Brain,
        color: 'text-orange-600',
      })
    }

    if (stats.totalTests < 3) {
      recommendations.push({
        title: 'Take a full-length mock test',
        description: 'Experience a real test environment and identify your weak areas.',
        action: 'Take Test',
        href: '/test',
        icon: ClipboardList,
        color: 'text-blue-600',
      })
    }

    if (recentActivity.length > 0 && recentActivity[0].type === 'test') {
      recommendations.push({
        title: 'Review your mistakes',
        description: 'Go through incorrect answers from your last test to learn and improve.',
        action: 'View Results',
        href: `/test/${recentActivity[0].testId}/results/${recentActivity[0].id}`,
        icon: BarChart3,
        color: 'text-purple-600',
      })
    }

    if (stats.currentStreak === 0) {
      recommendations.push({
        title: 'Start your daily practice',
        description: 'Build a habit by practicing daily. Try adaptive practice for personalized difficulty!',
        action: 'Practice Now',
        href: '/practice',
        icon: Flame,
        color: 'text-red-600',
      })
    }

    return recommendations.slice(0, 3)
  }

  const recommendations = getRecommendations()

  return (
    <DashboardShell
      profile={profile}
      stats={stats}
      recentActivity={recentActivity}
      performanceTrend={performanceTrend}
      weakAreas={weakAreas}
      masteryLevels={masteryLevels}
      adaptiveStates={adaptiveStates}
    >
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">
            {timeGreeting}, {studentName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's your learning progress and performance overview
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Tests Taken</div>
                <div className="bg-primary/10 text-primary flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-md">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.totalTests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTests > 0 ? 'Keep going!' : 'Take your first test'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Average Score</div>
                <div className="bg-primary/10 text-primary flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-md">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.avgScore.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.avgScore >= 70 ? 'Excellent!' : stats.avgScore >= 50 ? 'Good progress' : 'Keep practicing'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Questions Done</div>
                <div className="bg-primary/10 text-primary flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-md">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.totalQuestionsAnswered}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalQuestionsAnswered >= 100 ? 'Great practice!' : 'Practice more to improve'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Current Streak</div>
                <div className="bg-primary/10 text-primary flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-md">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground break-words">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.currentStreak > 0 ? 'Keep the streak alive!' : 'Start your streak today'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rank Cards */}
        {dashboardPreferences?.showRankCards && (
          <MotivationalRankCards
            userGlobalRank={userGlobalRank}
            userWeeklyRank={userWeeklyRank}
            userMonthlyRank={userMonthlyRank}
            totalUsers={totalUsers}
          />
        )}

        {/* Progress Tracking */}
        {dashboardPreferences?.showProgressTracking && (
          <ProgressTracking
            totalQuestionsAnswered={stats.totalQuestionsAnswered}
            totalTests={stats.totalTests}
            currentStreak={stats.currentStreak}
            progressToNextMilestone={progressToNextMilestone}
          />
        )}

        {/* Achievement Badges */}
        {dashboardPreferences?.showAchievementBadges && (
          <AchievementBadges
            totalQuestionsAnswered={stats.totalQuestionsAnswered}
            totalTests={stats.totalTests}
            avgScore={stats.avgScore}
            currentStreak={stats.currentStreak}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recommended Actions */}
          {dashboardPreferences?.showRecommendations && (
            <Card className="bg-card border-border">
              <CardHeader className="px-4 sm:px-6 pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Recommended</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Personalized suggestions for you</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="bg-primary/10 text-primary p-1.5 rounded-md flex-shrink-0">
                        <rec.icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm sm:text-base mb-1 break-words">{rec.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs sm:text-sm"
                      onClick={() => router.push(rec.href)}
                    >
                      {rec.action}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Peer Comparison */}
          {dashboardPreferences?.showPeerComparison && (
            <PeerComparison
              userGlobalRank={userGlobalRank}
              totalUsers={totalUsers}
              avgScore={stats.avgScore}
            />
          )}
        </div>

        {/* Improvement Trends - Full Width */}
        {dashboardPreferences?.showImprovementTrends && (
          <ImprovementTrends
            weekOverWeekImprovement={weekOverWeekImprovement}
            bestScore={bestScore}
            longestStreak={longestStreak}
            avgScore={stats.avgScore}
            currentStreak={stats.currentStreak}
          />
        )}

        {/* Performance Trend */}
        {dashboardPreferences?.showPerformanceTrend && performanceTrend.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="px-4 sm:px-6 pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Performance Over Time</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your score trend across recent tests</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] min-w-[300px]">
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                      formatter={(value: any) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score %"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weak Areas Alert */}
        {dashboardPreferences?.showWeakAreas && weakAreas.length > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5 sm:mt-1" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 break-words">
                    Areas Needing Attention
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                    You have lower accuracy ({' <'}60%) in the following topics:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    {weakAreas.map((area) => (
                      <Badge key={area} variant="secondary" className="bg-destructive/10 text-destructive-foreground text-xs sm:text-sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="sm:size-default bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto"
                    onClick={() => router.push('/practice')}
                  >
                    Practice These Topics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-primary text-primary-foreground border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/practice')}>
            <CardContent className="p-6 sm:p-8 text-center">
              <Brain className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2 break-words">Start Practice</h3>
              <p className="text-sm sm:text-base text-primary-foreground/80 leading-relaxed">
                Choose a topic and practice at your own pace
              </p>
            </CardContent>
          </Card>

          <Card className="bg-accent text-accent-foreground border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/test')}>
            <CardContent className="p-6 sm:p-8 text-center">
              <ClipboardList className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2 break-words">Take a Test</h3>
              <p className="text-sm sm:text-base text-accent-foreground/80 leading-relaxed">
                Experience real exam conditions with timed tests
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

