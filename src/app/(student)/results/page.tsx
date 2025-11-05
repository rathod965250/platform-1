import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { sanitizeSupabaseResult, extractRelationship } from '@/lib/supabase/utils'
import Link from 'next/link'
import { Clock, Trophy, TrendingUp, Calendar } from 'lucide-react'

export const metadata = {
  title: 'My Results | Aptitude Preparation Platform',
  description: 'View all your test results and performance history',
}

export default async function ResultsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all test attempts
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

  // Fetch user profile for DashboardShell
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch practice sessions for stats
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
  const { data: adaptiveStatesRaw } = await supabase
    .from('adaptive_state')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('user_id', user.id)

  // Sanitize adaptiveStates - filter out Supabase metadata
  const adaptiveStates = sanitizeSupabaseResult(adaptiveStatesRaw || []).map((state: any) => {
    const category = extractRelationship(state.category)
    return {
      ...state,
      category: category && typeof category === 'object' && 'name' in category 
        ? { name: category.name } 
        : null,
    }
  })

  // Build mastery levels map
  const masteryLevels: Record<string, number> = {}
  adaptiveStates.forEach((state: any) => {
    if (state.category?.name) {
      const mastery = typeof state.mastery_score === 'number'
        ? state.mastery_score
        : parseFloat(String(state.mastery_score || 0))
      masteryLevels[state.category.name] = mastery
    }
  })

  // Fetch user metrics for weak areas calculation
  const { data: allUserMetricsRaw } = await supabase
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

  // Sanitize user metrics - filter out Supabase metadata from nested relationships
  const allUserMetrics = sanitizeSupabaseResult(allUserMetricsRaw || []).map((metric: any) => {
    const question = extractRelationship(metric.question)
    if (question && typeof question === 'object') {
      const subcategory = extractRelationship(question.subcategory)
      if (subcategory && typeof subcategory === 'object') {
        const category = extractRelationship(subcategory.category)
        return {
          ...metric,
          question: {
            subcategory: {
              category: category && typeof category === 'object' && 'id' in category
                ? { id: category.id, name: category.name }
                : null,
            },
          },
        }
      }
      return {
        ...metric,
        question: {
          subcategory: subcategory && typeof subcategory === 'object'
            ? subcategory
            : null,
        },
      }
    }
    return {
      ...metric,
      question: question && typeof question === 'object' ? question : null,
    }
  })

  // Calculate category-wise performance for weak areas
  const categoryPerformanceMap = new Map<string, { correct: number; total: number }>()
  
  allUserMetrics.forEach((metric) => {
    const category = metric.question?.subcategory?.category
    if (category && typeof category === 'object' && !Array.isArray(category) && 'id' in category && 'name' in category && !('cardinality' in category)) {
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your test results and track your progress
          </p>
        </div>

        {testAttempts && testAttempts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {testAttempts.map((attempt: any) => {
              const test = attempt.test
              const scorePercentage = ((attempt.score / test.total_marks) * 100).toFixed(1)
              const accuracy = ((attempt.correct_answers / attempt.total_questions) * 100).toFixed(1)
              const timeInMinutes = Math.floor(attempt.time_taken_seconds / 60)

              return (
                <Card key={attempt.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {test.title}
                          </h3>
                          <Badge variant="secondary">{test.test_type}</Badge>
                          {test.company_name && (
                            <Badge variant="outline">{test.company_name}</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(attempt.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {timeInMinutes} minutes
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {accuracy}% accuracy
                          </div>
                          {attempt.percentile && (
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4" />
                              {attempt.percentile}th percentile
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            {scorePercentage}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {attempt.score}/{test.total_marks}
                          </div>
                        </div>

                        <Link href={`/test/${test.id}/results/${attempt.id}`}>
                          <Button>View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Trophy className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No results yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Take a test to see your results here
              </p>
              <Link href="/test">
                <Button size="lg">Take Your First Test</Button>
              </Link>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </DashboardShell>
  )
}

