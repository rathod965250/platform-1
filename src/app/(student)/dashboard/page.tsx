import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { PageSkeleton } from '@/components/shared/PageSkeleton'

export const metadata = {
  title: 'Dashboard | Aptitude Preparation Platform',
  description: 'Your personal dashboard for aptitude test preparation',
}

function DashboardLoading() {
  return <PageSkeleton />
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch test attempts statistics
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      total_questions,
      correct_answers,
      time_taken_seconds,
      submitted_at,
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

  // Fetch practice sessions statistics
  const { data: practiceSessions } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  // Calculate statistics
  const totalTests = testAttempts?.length || 0
  const totalPractice = practiceSessions?.length || 0
  const totalQuestionsAnswered = (testAttempts?.reduce((sum, attempt) => sum + attempt.total_questions, 0) || 0) +
    (practiceSessions?.reduce((sum, session) => sum + session.total_questions, 0) || 0)

  const avgScore = totalTests > 0
    ? testAttempts!.reduce((sum, attempt) => {
        const percentage = (attempt.score / (attempt.test as any).total_marks) * 100
        return sum + percentage
      }, 0) / totalTests
    : 0

  // Calculate streak (simplified - just checks if there's activity in last 24h)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const hasRecentActivity = 
    (testAttempts?.some(a => new Date(a.submitted_at!) > last24h)) ||
    (practiceSessions?.some(s => new Date(s.completed_at) > last24h))
  const currentStreak = hasRecentActivity ? 1 : 0

  // Get recent activity (last 5 items combined)
  const recentActivity = [
    ...(testAttempts?.slice(0, 3).map(attempt => ({
      type: 'test' as const,
      id: attempt.id,
      title: (attempt.test as any)?.title || 'Test',
      date: attempt.submitted_at!,
      score: attempt.score,
      totalMarks: (attempt.test as any)?.total_marks || 100,
      testId: (attempt.test as any)?.id,
    })) || []),
    ...(practiceSessions?.slice(0, 2).map(session => ({
      type: 'practice' as const,
      id: session.id,
      title: `Practice Session`,
      date: session.completed_at,
      score: session.correct_answers,
      totalMarks: session.total_questions,
    })) || []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Performance trend data (last 10 test attempts)
  const performanceTrend = testAttempts?.slice(0, 10).reverse().map((attempt, index) => ({
    index: index + 1,
    score: ((attempt.score / (attempt.test as any).total_marks) * 100).toFixed(1),
    date: new Date(attempt.submitted_at!).toLocaleDateString(),
  })) || []

  // Fetch adaptive states for mastery scores
  const { data: adaptiveStates } = await supabase
    .from('adaptive_state')
    .select(`
      *,
      category:categories(name, id)
    `)
    .eq('user_id', user.id)

  // Analyze weak areas from test attempts and adaptive states
  const categoryPerformance: Record<string, { correct: number; total: number }> = {}
  
  if (testAttempts) {
    for (const attempt of testAttempts) {
      // Fetch attempt answers to analyze category performance
      const { data: answers } = await supabase
        .from('attempt_answers')
        .select(`
          is_correct,
          question:questions(
            subcategory:subcategories(
              category:categories(name)
            )
          )
        `)
        .eq('attempt_id', attempt.id)

      answers?.forEach((answer: any) => {
        const categoryName = answer.question?.subcategory?.category?.name || 'Other'
        if (!categoryPerformance[categoryName]) {
          categoryPerformance[categoryName] = { correct: 0, total: 0 }
        }
        categoryPerformance[categoryName].total += 1
        if (answer.is_correct) {
          categoryPerformance[categoryName].correct += 1
        }
      })
    }
  }

  // Also check adaptive states for mastery scores
  adaptiveStates?.forEach((state: any) => {
    const categoryName = state.category?.name || 'Other'
    const mastery = parseFloat(state.mastery_score || 0)
    // If mastery < 40%, it's a weak area
    if (mastery < 0.4 && !categoryPerformance[categoryName]) {
      categoryPerformance[categoryName] = { correct: 0, total: 10 } // Estimate
    }
  })

  // Identify weak areas (accuracy < 60% or mastery < 40%)
  const weakAreas = Object.entries(categoryPerformance)
    .filter(([_, stats]) => {
      const accuracy = (stats.correct / stats.total) * 100
      return accuracy < 60 && stats.total >= 3 // At least 3 questions attempted
    })
    .map(([name]) => name)

  // Also add categories with low mastery scores
  adaptiveStates?.forEach((state: any) => {
    const categoryName = state.category?.name || 'Other'
    const mastery = parseFloat(state.mastery_score || 0)
    if (mastery < 0.4 && !weakAreas.includes(categoryName)) {
      weakAreas.push(categoryName)
    }
  })

  // Build mastery levels map
  const masteryLevels: Record<string, number> = {}
  adaptiveStates?.forEach((state: any) => {
    if (state.category?.name) {
      masteryLevels[state.category.name] = parseFloat(state.mastery_score || 0)
    }
  })

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent
        profile={profile}
        stats={{
          totalTests,
          avgScore,
          totalQuestionsAnswered,
          currentStreak,
        }}
        recentActivity={recentActivity}
        performanceTrend={performanceTrend}
        weakAreas={weakAreas}
        masteryLevels={masteryLevels}
        adaptiveStates={adaptiveStates || []}
      />
    </Suspense>
  )
}
