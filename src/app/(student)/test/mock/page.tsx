import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { MockTestBuilder } from '@/components/test/MockTestBuilder'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'Create Mock Test | Aptitude Preparation Platform',
  description: 'Create custom mock tests by selecting categories, subcategories, and difficulty levels.',
}

export default async function MockTestsPage() {
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

  // Calculate stats for DashboardShell with safety checks
  const totalTests = testAttempts?.length || 0
  const totalPracticeQuestions = practiceSessions?.reduce((sum, session) => sum + (session?.total_questions || 0), 0) || 0
  const totalTestQuestions = testAttempts?.reduce((sum, attempt) => sum + (attempt?.total_questions || 0), 0) || 0
  const totalQuestionsAnswered = totalTestQuestions + totalPracticeQuestions

  const avgScore = totalTests > 0 && testAttempts
    ? testAttempts.reduce((sum, attempt) => {
        if (!attempt) return sum
        const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
        const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
        const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
        if (totalMarks === 0) return sum
        const score = attempt.score || 0
        const percentage = (score / totalMarks) * 100
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

  // Build recent activity for DashboardShell with safety checks
  const recentActivity = [
    ...(testAttempts?.slice(0, 3).filter(attempt => attempt).map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      return {
        type: 'test' as const,
        id: attempt.id || '',
        title: (testObj && 'title' in testObj ? String(testObj.title) : 'Test'),
        date: attempt.submitted_at || new Date().toISOString(),
        score: attempt.score || 0,
        totalMarks: (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100),
        testId: (testObj && 'id' in testObj ? String(testObj.id) : undefined) || undefined,
      }
    }) || []),
    ...(practiceSessions?.slice(0, 2).filter(session => session).map(session => ({
      type: 'practice' as const,
      id: session.id || '',
      title: `Practice Session`,
      date: session.completed_at || session.created_at || new Date().toISOString(),
      score: session.correct_answers || 0,
      totalMarks: session.total_questions || 0,
    })) || []),
  ]
    .filter(item => item && item.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Performance trend for DashboardShell with safety checks
  const performanceTrend = testAttempts?.slice(0, 10).filter(attempt => attempt).reverse().map((attempt, index) => {
    const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
    const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
    const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
    const score = attempt.score || 0
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
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

  // Build mastery levels map with safety checks
  const masteryLevels: Record<string, number> = {}
  adaptiveStates?.forEach((state) => {
    if (state && state.category && state.category.name) {
      const mastery = typeof state.mastery_score === 'number'
        ? state.mastery_score
        : parseFloat(String(state.mastery_score || 0))
      masteryLevels[String(state.category.name)] = isNaN(mastery) ? 0 : mastery
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
  
  allUserMetrics?.forEach((metric: any) => {
    const question = metric.question
    const subcategory = question?.subcategory
    const category = subcategory?.category
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

  // Identify weak areas (accuracy < 60% or mastery < 40%) with safety checks
  const weakAreasArray: string[] = []
  categoryPerformanceMap.forEach((stats, categoryName) => {
    if (stats && typeof stats.total === 'number' && typeof stats.correct === 'number') {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      if (accuracy < 60 && stats.total >= 3 && categoryName) {
        weakAreasArray.push(String(categoryName))
      }
    }
  })

  // Also add categories with low mastery scores
  adaptiveStates?.forEach((state) => {
    if (state && state.category && state.category.name) {
      const categoryName = String(state.category.name)
      const mastery = typeof state.mastery_score === 'number'
        ? state.mastery_score
        : parseFloat(String(state.mastery_score || 0))
      if (!isNaN(mastery) && mastery < 0.4 && !weakAreasArray.includes(categoryName)) {
        weakAreasArray.push(categoryName)
      }
    }
  })

  // Fetch all categories with their subcategories
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      subcategories(
        id,
        name,
        slug
      )
    `)
    .order('name', { ascending: true })

  return (
    <DashboardShell
      profile={profile || null}
      stats={{
        totalTests: totalTests || 0,
        avgScore: avgScore || 0,
        totalQuestionsAnswered: totalQuestionsAnswered || 0,
        currentStreak: currentStreak || 0,
      }}
      recentActivity={recentActivity || []}
      performanceTrend={performanceTrend || []}
      weakAreas={weakAreasArray || []}
      masteryLevels={masteryLevels || {}}
      adaptiveStates={adaptiveStates || []}
    >
      <MockTestBuilder categories={categories || []} userId={user.id} />
    </DashboardShell>
  )
}

