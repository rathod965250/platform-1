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
      <div className="space-y-4 sm:space-y-5 md:space-y-6 px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
        {/* Welcome Section */}
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans leading-tight break-words">
            {timeGreeting}, {studentName}! 👋
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
            Here's your learning progress and performance overview
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground font-sans truncate">Tests Taken</div>
                <div className="bg-primary/10 text-primary flex size-8 sm:size-9 md:size-10 shrink-0 items-center justify-center rounded-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans mb-2">
                {stats.totalTests}
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                {stats.totalTests > 0 ? 'Keep going!' : 'Take your first test'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground font-sans truncate">Average Score</div>
                <div className="bg-primary/10 text-primary flex size-8 sm:size-9 md:size-10 shrink-0 items-center justify-center rounded-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans mb-2">
                {stats.avgScore.toFixed(1)}%
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                {stats.avgScore >= 70 ? 'Excellent!' : stats.avgScore >= 50 ? 'Good progress' : 'Keep practicing'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground font-sans truncate">Questions Done</div>
                <div className="bg-primary/10 text-primary flex size-8 sm:size-9 md:size-10 shrink-0 items-center justify-center rounded-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans mb-2">
                {stats.totalQuestionsAnswered}
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                {stats.totalQuestionsAnswered >= 100 ? 'Great practice!' : 'Practice more to improve'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground font-sans truncate">Current Streak</div>
                <div className="bg-primary/10 text-primary flex size-8 sm:size-9 md:size-10 shrink-0 items-center justify-center rounded-lg">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans mb-2 break-words">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {/* Recommended Actions */}
          {dashboardPreferences?.showRecommendations && (
            <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
              <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0 text-primary" />
                  <span className="truncate">Recommended</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans mt-1 sm:mt-1.5 md:mt-2">
                  Personalized suggestions for you
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 space-y-3 sm:space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-300 bg-card/50"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                      <div className="bg-primary/10 text-primary p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0">
                        <rec.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2 break-words font-sans">
                          {rec.title}
                        </h4>
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
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
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0 text-primary" />
                <span className="truncate">Performance Over Time</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans mt-1 sm:mt-1.5 md:mt-2">
                Your score trend across recent tests
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
              <div className="w-full overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] md:h-[350px] min-w-[300px]">
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ fontFamily: 'var(--font-sans)', fontSize: '12px' }}
                    />
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
          <Card className="border-2 border-destructive/30 bg-destructive/5 hover:border-destructive/50 transition-all duration-300">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-destructive flex-shrink-0 mt-0.5 sm:mt-1" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-2 sm:mb-3 break-words font-sans">
                    Areas Needing Attention
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 sm:mb-4 md:mb-5 leading-relaxed font-sans">
                    You have lower accuracy ({' <'}60%) in the following topics:
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3 mb-4 sm:mb-5 md:mb-6">
                    {weakAreas.map((area) => (
                      <Badge 
                        key={area} 
                        variant="secondary" 
                        className="bg-destructive/10 text-destructive-foreground border border-destructive/20 text-xs sm:text-sm md:text-base font-medium px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 font-sans"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto font-medium text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <Card 
            className="bg-primary text-primary-foreground border-0 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200 min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
            onClick={() => router.push('/practice')}
          >
            <CardContent className="p-5 sm:p-6 md:p-7 lg:p-8 text-center">
              <Brain className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 mx-auto mb-3 sm:mb-4 md:mb-5" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 break-words font-sans">
                Start Practice
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 leading-relaxed font-sans">
                Choose a topic and practice at your own pace
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-accent text-accent-foreground border-0 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200 min-h-[140px] sm:min-h-[160px] md:min-h-[180px]"
            onClick={() => router.push('/test')}
          >
            <CardContent className="p-5 sm:p-6 md:p-7 lg:p-8 text-center">
              <ClipboardList className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 mx-auto mb-3 sm:mb-4 md:mb-5" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 break-words font-sans">
                Take a Test
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-accent-foreground/90 leading-relaxed font-sans">
                Experience real exam conditions with timed tests
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

