import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Target, Clock, Award, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Analytics | Aptitude Preparation Platform',
  description: 'Detailed analytics and performance insights',
}

export default async function AnalyticsPage() {
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
        company_name,
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
    // Handle the nested structure - question can be an array or object
    const question = Array.isArray(metric.question) ? metric.question[0] : metric.question
    if (!question || typeof question !== 'object') return
    
    // Handle subcategory - can be an array or object
    const subcategory = Array.isArray(question.subcategory) 
      ? question.subcategory[0] 
      : question.subcategory
    if (!subcategory || typeof subcategory !== 'object') return
    
    // Handle category - can be an array or object
    const category = Array.isArray(subcategory.category)
      ? subcategory.category[0]
      : subcategory.category
    
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

  // Calculate category-wise statistics for analytics
  const categoryStats = Array.from(categoryPerformanceMap.entries()).map(([category, stats]) => ({
    category,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    total: stats.total,
    correct: stats.correct,
  })).sort((a, b) => b.total - a.total)

  // Calculate test type performance
  const testTypeStats = new Map<string, { total: number; avgScore: number; sum: number }>()
  testAttempts?.forEach((attempt) => {
    const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
    const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
    const testType = (testObj && 'test_type' in testObj ? String(testObj.test_type) : 'Unknown') || 'Unknown'
    const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
    const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
    
    const current = testTypeStats.get(testType) || { total: 0, avgScore: 0, sum: 0 }
    current.total += 1
    current.sum = (current.sum || 0) + percentage
    current.avgScore = current.sum / current.total
    testTypeStats.set(testType, current)
  })

  // Calculate time-based statistics
  const weeklyStats = testAttempts?.filter(attempt => {
    const attemptDate = new Date(attempt.submitted_at || new Date().toISOString())
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return attemptDate >= weekAgo
  }) || []

  const monthlyStats = testAttempts?.filter(attempt => {
    const attemptDate = new Date(attempt.submitted_at || new Date().toISOString())
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return attemptDate >= monthAgo
  }) || []

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
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Detailed performance insights and statistics
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Total Tests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalTests}</div>
                <p className="text-xs text-muted-foreground">
                  {weeklyStats.length} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{avgScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Across all attempts
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Questions Answered</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalQuestionsAnswered}</div>
                <p className="text-xs text-muted-foreground">
                  {practiceSessions?.length || 0} practice sessions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Current Streak</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
                <p className="text-xs text-muted-foreground">
                  Days in a row
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time-based Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Weekly Performance</CardTitle>
                <CardDescription>Last 7 days statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tests Taken</span>
                    <span className="text-sm font-medium text-foreground">{weeklyStats.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Score</span>
                    <span className="text-sm font-medium text-foreground">
                      {weeklyStats.length > 0
                        ? (weeklyStats.reduce((sum, attempt) => {
                            const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
                            const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
                            const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
                            const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
                            return sum + percentage
                          }, 0) / weeklyStats.length).toFixed(1)
                        : '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Monthly Performance</CardTitle>
                <CardDescription>Last 30 days statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tests Taken</span>
                    <span className="text-sm font-medium text-foreground">{monthlyStats.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Score</span>
                    <span className="text-sm font-medium text-foreground">
                      {monthlyStats.length > 0
                        ? (monthlyStats.reduce((sum, attempt) => {
                            const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
                            const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
                            const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
                            const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
                            return sum + percentage
                          }, 0) / monthlyStats.length).toFixed(1)
                        : '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          {categoryStats.length > 0 && (
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Category Performance</CardTitle>
                <CardDescription>Performance breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.slice(0, 10).map((stat) => (
                    <div key={stat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{stat.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.accuracy.toFixed(1)}% ({stat.correct}/{stat.total})
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stat.accuracy >= 75
                              ? 'bg-primary'
                              : stat.accuracy >= 50
                              ? 'bg-chart-3'
                              : 'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(stat.accuracy, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Type Performance */}
          {testTypeStats.size > 0 && (
            <Card className="mb-8 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Test Type Performance</CardTitle>
                <CardDescription>Performance by test type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(testTypeStats.entries()).map(([testType, stats]) => (
                    <div key={testType} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{testType}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {stats.total} test{stats.total !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {stats.avgScore.toFixed(1)}% avg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weak Areas */}
          {weakAreasArray.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <AlertCircle className="h-5 w-5 text-chart-3" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>Categories that need more practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weakAreasArray.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

