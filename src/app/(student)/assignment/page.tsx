import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FileText, Building2, Upload } from 'lucide-react'
import Link from 'next/link'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Take Test',
  description: 'Choose from mock tests or company-specific aptitude tests. Experience real exam-like conditions with timed tests and detailed analytics.',
  openGraph: {
    title: 'Take Test | Aptitude Preparation Platform',
    description: 'Choose from mock tests or company-specific aptitude tests from TCS, Infosys, Wipro, Accenture, and Cognizant.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Take Test | Aptitude Preparation Platform',
    description: 'Practice with real exam-like mock tests and company-specific questions.',
  },
}

export default async function TestSelectionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch published tests
  const { data: tests } = await supabase
    .from('tests')
    .select(`
      *,
      category:categories(name),
      questions!questions_test_id_fkey(count)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Group tests by type
  const mockTests = tests?.filter(t => t.test_type === 'mock') || []
  const companyTests = tests?.filter(t => t.test_type === 'company_specific') || []

  // Fetch user profile for DashboardShell
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch test attempts for stats
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      total_questions,
      submitted_at,
      test:tests(total_marks)
    `)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  // Fetch practice sessions for total questions
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Choose Test Type
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Select the type of test you want to take
          </p>
        </div>

        {/* Test Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* All Questions / Mock Tests */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Mock Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mixed topics from all categories
              </p>
              <Badge variant="secondary" className="mb-4">
                {mockTests.length} {mockTests.length === 1 ? 'test' : 'tests'} available
              </Badge>
              <Link href="#mock-tests" className="w-full">
                <Button className="w-full">Select</Button>
              </Link>
            </div>
          </Card>

          {/* Company Specific */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Company Specific
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Previous year company questions
              </p>
              <Badge variant="secondary" className="mb-4">
                {companyTests.length} {companyTests.length === 1 ? 'test' : 'tests'} available
              </Badge>
              <Link href="#company-tests" className="w-full">
                <Button className="w-full">Select</Button>
              </Link>
            </div>
          </Card>

          {/* Custom Test */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-60">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Custom Test
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your own question paper
              </p>
              <Badge variant="outline" className="mb-4">
                Coming Soon
              </Badge>
              <Button className="w-full" disabled>
                Select
              </Button>
            </div>
          </Card>
        </div>

        {/* Mock Tests List */}
        {mockTests.length > 0 && (
          <div id="mock-tests" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Mock Tests
            </h2>
            <div className="grid gap-4">
              {mockTests.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {test.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {test.category && (
                          <span>📚 {test.category.name}</span>
                        )}
                        <span>⏱️ {test.duration_minutes} mins</span>
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                        <span>💯 {test.total_marks} marks</span>
                        {test.negative_marking && (
                          <span className="text-red-600">❌ Negative Marking</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button>
                        Start Test
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Company Specific Tests List */}
        {companyTests.length > 0 && (
          <div id="company-tests">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Company Specific Tests
            </h2>
            <div className="grid gap-4">
              {companyTests.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test.title}
                        </h3>
                        {test.company_name && (
                          <Badge variant="default">{test.company_name}</Badge>
                        )}
                      </div>
                      {test.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {test.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {test.category && (
                          <span>📚 {test.category.name}</span>
                        )}
                        <span>⏱️ {test.duration_minutes} mins</span>
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                        <span>💯 {test.total_marks} marks</span>
                        {test.negative_marking && (
                          <span className="text-red-600">❌ Negative Marking</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button>
                        Start Test
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Tests Available */}
        {(!tests || tests.length === 0) && (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tests available yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please check back later for new tests
            </p>
          </Card>
        )}
        </div>
      </div>
    </DashboardShell>
  )
}

