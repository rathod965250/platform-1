import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Trophy, Target, Star, Zap, Flame } from 'lucide-react'

export const metadata = {
  title: 'Achievements | Aptitude Preparation Platform',
  description: 'View your achievements and milestones',
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile for DashboardShell
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch test attempts
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select(`
      *,
      test:tests(
        id,
        title,
        test_type,
        total_marks
      )
    `)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  // Fetch practice sessions
  const { data: practiceSessions } = await supabase
    .from('practice_sessions')
    .select('id, total_questions, correct_answers, completed_at, created_at')
    .eq('user_id', user.id)

  // Calculate stats for DashboardShell
  const totalTests = testAttempts?.length || 0
  const totalPracticeQuestions = practiceSessions?.reduce((sum, session) => sum + (session.total_questions || 0), 0) || 0
  const totalTestQuestions = testAttempts?.reduce((sum, attempt) => sum + attempt.total_questions, 0) || 0
  const totalQuestionsAnswered = totalTestQuestions + totalPracticeQuestions

  const avgScore = totalTests > 0
    ? testAttempts!.reduce((sum, attempt) => {
        const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
        const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
        const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
        if (totalMarks === 0) return sum
        const percentage = (attempt.score / totalMarks) * 100
        return sum + percentage
      }, 0) / totalTests
    : 0

  // Fetch user analytics for streak
  const { data: userAnalytics } = await supabase
    .from('user_analytics')
    .select('current_streak_days')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  const currentStreak = userAnalytics?.[0]?.current_streak_days || 0

  // Build recent activity for DashboardShell
  const recentActivity = [
    ...(testAttempts?.slice(0, 3).map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      return {
        type: 'test' as const,
        id: attempt.id,
        title: (testObj && 'title' in testObj ? String(testObj.title) : 'Test'),
        date: attempt.submitted_at || new Date().toISOString(),
        score: attempt.score,
        totalMarks: (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100),
        testId: (testObj && 'id' in testObj ? String(testObj.id) : undefined) || undefined,
      }
    }) || []),
    ...(practiceSessions?.slice(0, 2).map(session => ({
      type: 'practice' as const,
      id: session.id,
      title: `Practice Session`,
      date: session.completed_at || session.created_at,
      score: session.correct_answers || 0,
      totalMarks: session.total_questions || 0,
    })) || []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Performance trend for DashboardShell
  const performanceTrend = testAttempts?.slice(0, 10).reverse().map((attempt, index) => {
    const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
    const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
    const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
    const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
    return {
      index: index + 1,
      score: percentage.toFixed(1),
      date: new Date(attempt.submitted_at || new Date().toISOString()).toLocaleDateString(),
    }
  }) || []

  // Fetch adaptive states for mastery levels
  const { data: adaptiveStates } = await supabase
    .from('adaptive_state')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('user_id', user.id)

  // Build mastery levels map
  const masteryLevels: Record<string, number> = {}
  adaptiveStates?.forEach((state) => {
    if (state.category?.name) {
      const mastery = typeof state.mastery_score === 'number'
        ? state.mastery_score
        : parseFloat(String(state.mastery_score || 0))
      masteryLevels[state.category.name] = mastery
    }
  })

  // Fetch user metrics for weak areas calculation
  const { data: allUserMetrics } = await supabase
    .from('user_metrics')
    .select(`
      is_correct,
      question:questions(
        subcategory:subcategories(
          category:categories(id, name)
        )
      )
    `)
    .eq('user_id', user.id)
    .limit(5000)

  // Calculate category-wise performance for weak areas
  const categoryPerformanceMap = new Map<string, { correct: number; total: number }>()
  
  allUserMetrics?.forEach((metric) => {
    const category = metric.question?.subcategory?.category
    if (category && typeof category === 'object' && !Array.isArray(category) && 'id' in category && 'name' in category) {
      const categoryName = String(category.name)
      const current = categoryPerformanceMap.get(categoryName) || { correct: 0, total: 0 }
      current.total += 1
      if (metric.is_correct) {
        current.correct += 1
      }
      categoryPerformanceMap.set(categoryName, current)
    }
  })

  // Identify weak areas (accuracy < 60% or mastery < 40%)
  const weakAreasArray: string[] = []
  categoryPerformanceMap.forEach((stats, categoryName) => {
    const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    if (accuracy < 60 && stats.total >= 3) {
      weakAreasArray.push(categoryName)
    }
  })

  // Also add categories with low mastery scores
  adaptiveStates?.forEach((state) => {
    const categoryName = state.category?.name
    if (categoryName) {
      const mastery = typeof state.mastery_score === 'number'
        ? state.mastery_score
        : parseFloat(String(state.mastery_score || 0))
      if (mastery < 0.4 && !weakAreasArray.includes(categoryName)) {
        weakAreasArray.push(categoryName)
      }
    }
  })

  // Calculate achievements
  const achievements = [
    {
      id: 'first-test',
      title: 'First Test',
      description: 'Complete your first test',
      icon: Star,
      unlocked: totalTests >= 1,
      progress: totalTests >= 1 ? 100 : 0,
    },
    {
      id: 'perfect-score',
      title: 'Perfect Score',
      description: 'Score 100% on any test',
      icon: Trophy,
      unlocked: testAttempts?.some(attempt => {
        const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
        const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
        const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
        return totalMarks > 0 && attempt.score === totalMarks
      }) || false,
      progress: 0,
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: Flame,
      unlocked: currentStreak >= 7,
      progress: Math.min((currentStreak / 7) * 100, 100),
    },
    {
      id: 'tests-10',
      title: 'Test Master',
      description: 'Complete 10 tests',
      icon: Award,
      unlocked: totalTests >= 10,
      progress: Math.min((totalTests / 10) * 100, 100),
    },
    {
      id: 'questions-100',
      title: 'Century Club',
      description: 'Answer 100 questions',
      icon: Target,
      unlocked: totalQuestionsAnswered >= 100,
      progress: Math.min((totalQuestionsAnswered / 100) * 100, 100),
    },
    {
      id: 'high-score',
      title: 'High Achiever',
      description: 'Score above 90% on any test',
      icon: Zap,
      unlocked: testAttempts?.some(attempt => {
        const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
        const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
        const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
        return totalMarks > 0 && (attempt.score / totalMarks) * 100 >= 90
      }) || false,
      progress: 0,
    },
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <DashboardShell
      profile={profile}
      stats={{
        totalTests,
        avgScore,
        totalQuestionsAnswered,
        currentStreak,
      }}
      recentActivity={recentActivity}
      performanceTrend={performanceTrend}
      weakAreas={weakAreasArray}
      masteryLevels={masteryLevels}
      adaptiveStates={adaptiveStates || []}
    >
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Achievements</h1>
            <p className="text-muted-foreground">
              Track your milestones and accomplishments
            </p>
          </div>

          {/* Achievement Summary */}
          <Card className="mb-8 bg-secondary border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-secondary-foreground">Achievement Progress</CardTitle>
              <CardDescription className="text-secondary-foreground/70">
                Unlocked {unlockedCount} of {achievements.length} achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-4 shadow-inner">
                <div
                  className="bg-primary h-4 rounded-full transition-all shadow-sm flex items-center justify-end pr-2"
                  style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                >
                  <span className="text-xs font-semibold text-primary-foreground">
                    {Math.round((unlockedCount / achievements.length) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              // Alternate colors for variety
              const colorVariants = [
                { bg: 'bg-primary', text: 'text-primary-foreground', border: 'border-primary' },
                { bg: 'bg-secondary', text: 'text-secondary-foreground', border: 'border-secondary' },
                { bg: 'bg-accent', text: 'text-accent-foreground', border: 'border-accent' },
              ]
              const variant = colorVariants[index % colorVariants.length]
              
              return (
                <Card
                  key={achievement.id}
                  className={`bg-card border-2 transition-all hover:shadow-lg ${
                    achievement.unlocked
                      ? `${variant.border} shadow-md`
                      : 'border-muted opacity-70'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-4 rounded-xl shadow-sm transition-all ${
                          achievement.unlocked
                            ? `${variant.bg} ${variant.text} scale-105`
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <CardTitle 
                          className={`text-foreground text-lg ${
                            achievement.unlocked 
                              ? '' 
                              : 'line-through text-muted-foreground'
                          }`}
                        >
                          {achievement.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {achievement.description}
                        </CardDescription>
                      </div>
                      {achievement.unlocked && (
                        <Badge 
                          variant="default" 
                          className={`shrink-0 ${variant.bg} ${variant.text} border-0`}
                        >
                          ✓ Unlocked
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {!achievement.unlocked && achievement.progress > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Progress</span>
                          <span className="text-foreground font-semibold">{achievement.progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 shadow-inner">
                          <div
                            className={`bg-primary h-2.5 rounded-full transition-all shadow-sm`}
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                  {achievement.unlocked && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">Achievement Unlocked!</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

