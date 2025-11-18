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
        questions!questions_test_id_fkey(count)
      ),
      assigned_by_profile:profiles!student_assignments_assigned_by_fkey(full_name, email)
    `)
    .eq('student_id', user.id)
    .order('assigned_at', { ascending: false })

  if (assignmentsError) {
    console.error('Error fetching assignments:', {
      message: assignmentsError.message,
      details: assignmentsError.details,
      hint: assignmentsError.hint,
      code: assignmentsError.code,
      error: assignmentsError
    })
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
      questions!inner(
        subcategories!inner(
          categories!inner(id, name)
        )
      )
    `)
    .eq('user_id', user.id)
    .limit(5000)

  // Calculate category-wise performance for weak areas
  const categoryPerformanceMap = new Map<string, { correct: number; total: number }>()
  
  allUserMetrics?.forEach((metric: any) => {
    // Access the nested structure from Supabase join
    const category = metric.questions?.subcategories?.categories
    if (category && typeof category === 'object' && 'id' in category && 'name' in category) {
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
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-5 md:px-6 lg:px-8 max-w-7xl space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans leading-tight break-words">
            Assignments
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
            View and complete your assigned tests
          </p>
        </div>

        {/* Assignment Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6 md:mb-8">
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans truncate">Pending</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans break-words">{pendingAssignments.length}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-500 flex-shrink-0" />
              </div>
            </div>
          </Card>
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans truncate">In Progress</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans break-words">{inProgressAssignments.length}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
              </div>
            </div>
          </Card>
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans truncate">Completed</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans break-words">{completedAssignments.length}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
              </div>
            </div>
          </Card>
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <div className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans truncate">Overdue</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans break-words">{overdueAssignments.length}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500 flex-shrink-0" />
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 sm:gap-3 font-sans">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-500 flex-shrink-0" />
              <span className="truncate">Pending Assignments</span>
            </h2>
            <div className="grid gap-3 sm:gap-4 md:gap-5">
              {pendingAssignments.map((test) => (
                <Card key={test.id} className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md border-l-4 border-l-yellow-500">
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5 md:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-3.5 md:mb-4 flex-wrap">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words font-sans">
                            {test.title}
                          </h3>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-2 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans shrink-0">
                            Pending
                          </Badge>
                        </div>
                        {test.description && (
                          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 sm:mb-3.5 md:mb-4 font-sans leading-relaxed break-words">
                            {test.description}
                          </p>
                        )}
                        {test.assignment?.instructions && (
                          <div className="mb-3 sm:mb-3.5 md:mb-4 p-3 sm:p-3.5 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800/30">
                            <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 dark:text-blue-300 mb-1.5 sm:mb-2 font-sans">Instructions:</p>
                            <p className="text-xs sm:text-sm md:text-base text-blue-800 dark:text-blue-400 font-sans leading-relaxed break-words">{test.assignment.instructions}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans">
                          {test.category && (
                            <span className="flex items-center gap-1.5 sm:gap-2">
                              <span>📚</span>
                              <span className="break-words">{test.category.name}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>⏱️</span>
                            <span>{test.duration_minutes} mins</span>
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>📝</span>
                            <span>{test.questions?.[0]?.count || 0} questions</span>
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>💯</span>
                            <span>{test.total_marks} marks</span>
                          </span>
                          {test.negative_marking && (
                            <span className="flex items-center gap-1.5 sm:gap-2 text-destructive font-semibold">
                              <span>❌</span>
                              <span>Negative Marking</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                          {test.assignment?.due_date && (
                            <span className="flex items-center gap-1.5 sm:gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                              <span>Due: {new Date(test.assignment.due_date).toLocaleDateString()}</span>
                            </span>
                          )}
                          {test.assignment?.assigned_by && (
                            <span className="break-words">Assigned by: {test.assignment.assigned_by.full_name || test.assignment.assigned_by.email}</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/test/${test.id}/instructions`} className="shrink-0">
                        <Button className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200">
                          Start Assignment
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Assignments */}
        {inProgressAssignments.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 sm:gap-3 font-sans">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-500 flex-shrink-0" />
              <span className="truncate">In Progress</span>
            </h2>
            <div className="grid gap-3 sm:gap-4 md:gap-5">
              {inProgressAssignments.map((test) => (
                <Card key={test.id} className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md border-l-4 border-l-blue-500">
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5 md:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-3.5 md:mb-4 flex-wrap">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words font-sans">
                            {test.title}
                          </h3>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-2 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans shrink-0">
                            In Progress
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>⏱️</span>
                            <span>{test.duration_minutes} mins</span>
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>📝</span>
                            <span>{test.questions?.[0]?.count || 0} questions</span>
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>💯</span>
                            <span>{test.total_marks} marks</span>
                          </span>
                        </div>
                      </div>
                      <Link href={`/test/${test.id}/instructions`} className="shrink-0">
                        <Button className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200">
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Assignments */}
        {overdueAssignments.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 sm:gap-3 font-sans">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-red-500 flex-shrink-0" />
              <span className="truncate">Overdue Assignments</span>
            </h2>
            <div className="grid gap-3 sm:gap-4 md:gap-5">
              {overdueAssignments.map((test) => (
                <Card key={test.id} className="bg-card border-2 border-destructive/30 bg-destructive/5 hover:border-destructive/50 transition-all duration-300 hover:shadow-md border-l-4 border-l-red-500">
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5 md:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-3.5 md:mb-4 flex-wrap">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words font-sans">
                            {test.title}
                          </h3>
                          <Badge variant="destructive" className="text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans shrink-0">
                            Overdue
                          </Badge>
                        </div>
                        {test.assignment?.due_date && (
                          <p className="text-xs sm:text-sm md:text-base text-destructive mb-2 sm:mb-2.5 md:mb-3 font-semibold font-sans">
                            Was due on: {new Date(test.assignment.due_date).toLocaleDateString()}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>⏱️</span>
                            <span>{test.duration_minutes} mins</span>
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>📝</span>
                            <span>{test.questions?.[0]?.count || 0} questions</span>
                          </span>
                        </div>
                      </div>
                      <Link href={`/test/${test.id}/instructions`} className="shrink-0">
                        <Button variant="destructive" className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200">
                          Complete Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Assignments */}
        {completedAssignments.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 sm:gap-3 font-sans">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500 flex-shrink-0" />
              <span className="truncate">Completed</span>
            </h2>
            <div className="grid gap-3 sm:gap-4 md:gap-5">
              {completedAssignments.map((test) => (
                <Card key={test.id} className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md border-l-4 border-l-green-500 opacity-75">
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5 md:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-3.5 md:mb-4 flex-wrap">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words font-sans">
                            {test.title}
                          </h3>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-2 border-green-300 dark:bg-green-900/20 dark:text-green-400 text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans shrink-0">
                            Completed
                          </Badge>
                        </div>
                        {test.assignment?.completed_at && (
                          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans">
                            Completed on: {new Date(test.assignment.completed_at).toLocaleDateString()}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>📝</span>
                            <span>{test.questions?.[0]?.count || 0} questions</span>
                          </span>
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <span>💯</span>
                            <span>{test.total_marks} marks</span>
                          </span>
                        </div>
                      </div>
                      <Link href={`/test/${test.id}/results`} className="shrink-0">
                        <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 border-2 border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200">
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Assignments Available */}
        {assignedTests.length === 0 && (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <div className="p-8 sm:p-10 md:p-12 text-center">
              <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-muted-foreground opacity-50 mb-4 sm:mb-5 md:mb-6" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans">
                No assignments available yet
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
                Your admin will assign tests to you. Please check back later.
              </p>
            </div>
          </Card>
        )}
        </div>
      </div>
    </DashboardShell>
  )
}

