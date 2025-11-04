import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FileText, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Assignments | Aptitude Preparation Platform',
  description: 'View and take assignments. Experience real exam-like conditions with timed tests and detailed analytics.',
  openGraph: {
    title: 'Assignments | Aptitude Preparation Platform',
    description: 'View and take assignments with real exam-like conditions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assignments | Aptitude Preparation Platform',
    description: 'View and take assignments with real exam-like conditions.',
  },
}

export default async function AssignmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch assignments allocated to this student
  const { data: assignments, error: assignmentsError } = await supabase
    .from('student_assignments')
    .select(`
      *,
      test:tests(
        *,
        category:categories(name),
        questions(count)
      ),
      assigned_by_profile:profiles!student_assignments_assigned_by_fkey(full_name, email)
    `)
    .eq('student_id', user.id)
    .order('assigned_at', { ascending: false })

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError)
  }

  // Extract tests from assignments
  const assignedTests = assignments?.map(assignment => {
    const test = Array.isArray(assignment.test) ? assignment.test[0] : assignment.test
    return {
      ...test,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        due_date: assignment.due_date,
        instructions: assignment.instructions,
        assigned_at: assignment.assigned_at,
        assigned_by: assignment.assigned_by_profile,
      }
    }
  }).filter(test => test && test.id) || []

  // Group by status
  const pendingAssignments = assignedTests.filter(t => t.assignment?.status === 'pending')
  const inProgressAssignments = assignedTests.filter(t => t.assignment?.status === 'in_progress')
  const completedAssignments = assignedTests.filter(t => t.assignment?.status === 'completed')
  const overdueAssignments = assignedTests.filter(t => t.assignment?.status === 'overdue')

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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignments
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and complete your assigned tests
          </p>
        </div>

        {/* Assignment Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingAssignments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressAssignments.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedAssignments.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueAssignments.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-yellow-500" />
              Pending Assignments
            </h2>
            <div className="grid gap-4">
              {pendingAssignments.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test.title}
                        </h3>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Pending
                        </Badge>
                      </div>
                      {test.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {test.description}
                        </p>
                      )}
                      {test.assignment?.instructions && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Instructions:</p>
                          <p className="text-sm text-blue-800 dark:text-blue-400">{test.assignment.instructions}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
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
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500 mt-2">
                        {test.assignment?.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(test.assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {test.assignment?.assigned_by && (
                          <span>Assigned by: {test.assignment.assigned_by.full_name || test.assignment.assigned_by.email}</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button>
                        Start Assignment
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Assignments */}
        {inProgressAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-blue-500" />
              In Progress
            </h2>
            <div className="grid gap-4">
              {inProgressAssignments.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test.title}
                        </h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">
                          In Progress
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>⏱️ {test.duration_minutes} mins</span>
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                        <span>💯 {test.total_marks} marks</span>
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button>
                        Continue
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Assignments */}
        {overdueAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Overdue Assignments
            </h2>
            <div className="grid gap-4">
              {overdueAssignments.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test.title}
                        </h3>
                        <Badge variant="destructive">Overdue</Badge>
                      </div>
                      {test.assignment?.due_date && (
                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                          Was due on: {new Date(test.assignment.due_date).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>⏱️ {test.duration_minutes} mins</span>
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button variant="destructive">
                        Complete Now
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Assignments */}
        {completedAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Completed
            </h2>
            <div className="grid gap-4">
              {completedAssignments.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test.title}
                        </h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                          Completed
                        </Badge>
                      </div>
                      {test.assignment?.completed_at && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Completed on: {new Date(test.assignment.completed_at).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                        <span>💯 {test.total_marks} marks</span>
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/results`}>
                      <Button variant="outline">
                        View Results
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Assignments Available */}
        {assignedTests.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No assignments available yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your admin will assign tests to you. Please check back later.
            </p>
          </Card>
        )}
        </div>
      </div>
    </DashboardShell>
  )
}

