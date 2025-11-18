import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardContent } from '@/components/leaderboard/LeaderboardContent'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata = {
  title: 'Leaderboard | Aptitude Preparation Platform',
  description: 'See how you rank against other students',
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all published tests for filter dropdown
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, test_type, company_name')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const { data: globalLeaderboard } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      time_taken_seconds,
      submitted_at,
      user:profiles!test_attempts_user_id_fkey(
        id,
        full_name,
        college
      ),
      test:tests(
        id,
        title,
        total_marks
      )
    `)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .order('time_taken_seconds', { ascending: true })
    .order('submitted_at', { ascending: true })
    .limit(200)

  const bestByUserGlobal = new Map<string, any>()
  ;(globalLeaderboard || []).forEach((attempt: any) => {
    const uid = attempt.user?.id
    if (!uid) return
    if (!bestByUserGlobal.has(uid)) {
      bestByUserGlobal.set(uid, attempt)
      return
    }
    const prev = bestByUserGlobal.get(uid)
    if (
      attempt.score > prev.score ||
      (attempt.score === prev.score && attempt.time_taken_seconds < prev.time_taken_seconds) ||
      (attempt.score === prev.score && attempt.time_taken_seconds === prev.time_taken_seconds && new Date(attempt.submitted_at).getTime() < new Date(prev.submitted_at).getTime())
    ) {
      bestByUserGlobal.set(uid, attempt)
    }
  })
  const processedGlobalLeaderboard = Array.from(bestByUserGlobal.values())
    .map((attempt: any) => ({
      userId: attempt.user?.id,
      userName: attempt.user?.full_name || 'Anonymous',
      college: attempt.user?.college,
      score: attempt.score,
      totalMarks: attempt.test?.total_marks || 100,
      percentage: ((attempt.score / (attempt.test?.total_marks || 100)) * 100).toFixed(1),
      timeTaken: attempt.time_taken_seconds,
      testTitle: attempt.test?.title,
      submittedAt: attempt.submitted_at,
    }))
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    })
    .slice(0, 50)
    .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }))

  // Find current user's global rank
  const userGlobalRank = processedGlobalLeaderboard.findIndex(
    (entry) => entry.userId === user.id
  ) + 1

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: weeklyLeaderboard } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      time_taken_seconds,
      submitted_at,
      user:profiles!test_attempts_user_id_fkey(
        id,
        full_name,
        college
      ),
      test:tests(
        id,
        title,
        total_marks
      )
    `)
    .gte('submitted_at', weekAgo)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .order('time_taken_seconds', { ascending: true })
    .order('submitted_at', { ascending: true })
    .limit(200)

  const bestByUserWeekly = new Map<string, any>()
  ;(weeklyLeaderboard || []).forEach((attempt: any) => {
    const uid = attempt.user?.id
    if (!uid) return
    if (!bestByUserWeekly.has(uid)) {
      bestByUserWeekly.set(uid, attempt)
      return
    }
    const prev = bestByUserWeekly.get(uid)
    if (
      attempt.score > prev.score ||
      (attempt.score === prev.score && attempt.time_taken_seconds < prev.time_taken_seconds) ||
      (attempt.score === prev.score && attempt.time_taken_seconds === prev.time_taken_seconds && new Date(attempt.submitted_at).getTime() < new Date(prev.submitted_at).getTime())
    ) {
      bestByUserWeekly.set(uid, attempt)
    }
  })
  const processedWeeklyLeaderboard = Array.from(bestByUserWeekly.values())
    .map((attempt: any) => ({
      userId: attempt.user?.id,
      userName: attempt.user?.full_name || 'Anonymous',
      college: attempt.user?.college,
      score: attempt.score,
      totalMarks: attempt.test?.total_marks || 100,
      percentage: ((attempt.score / (attempt.test?.total_marks || 100)) * 100).toFixed(1),
      timeTaken: attempt.time_taken_seconds,
      testTitle: attempt.test?.title,
      submittedAt: attempt.submitted_at,
    }))
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    })
    .slice(0, 50)
    .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }))

  const userWeeklyRank = processedWeeklyLeaderboard.findIndex(
    (entry) => entry.userId === user.id
  ) + 1

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: monthlyLeaderboard } = await supabase
    .from('test_attempts')
    .select(`
      id,
      score,
      time_taken_seconds,
      submitted_at,
      user:profiles!test_attempts_user_id_fkey(
        id,
        full_name,
        college
      ),
      test:tests(
        id,
        title,
        total_marks
      )
    `)
    .gte('submitted_at', monthAgo)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .order('time_taken_seconds', { ascending: true })
    .order('submitted_at', { ascending: true })
    .limit(200)

  const bestByUserMonthly = new Map<string, any>()
  ;(monthlyLeaderboard || []).forEach((attempt: any) => {
    const uid = attempt.user?.id
    if (!uid) return
    if (!bestByUserMonthly.has(uid)) {
      bestByUserMonthly.set(uid, attempt)
      return
    }
    const prev = bestByUserMonthly.get(uid)
    if (
      attempt.score > prev.score ||
      (attempt.score === prev.score && attempt.time_taken_seconds < prev.time_taken_seconds) ||
      (attempt.score === prev.score && attempt.time_taken_seconds === prev.time_taken_seconds && new Date(attempt.submitted_at).getTime() < new Date(prev.submitted_at).getTime())
    ) {
      bestByUserMonthly.set(uid, attempt)
    }
  })
  const processedMonthlyLeaderboard = Array.from(bestByUserMonthly.values())
    .map((attempt: any) => ({
      userId: attempt.user?.id,
      userName: attempt.user?.full_name || 'Anonymous',
      college: attempt.user?.college,
      score: attempt.score,
      totalMarks: attempt.test?.total_marks || 100,
      percentage: ((attempt.score / (attempt.test?.total_marks || 100)) * 100).toFixed(1),
      timeTaken: attempt.time_taken_seconds,
      testTitle: attempt.test?.title,
      submittedAt: attempt.submitted_at,
    }))
    .sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    })
    .slice(0, 50)
    .map((entry: any, index: number) => ({ ...entry, rank: index + 1 }))

  const userMonthlyRank = processedMonthlyLeaderboard.findIndex(
    (entry) => entry.userId === user.id
  ) + 1

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
      <LeaderboardContent
        currentUserId={user.id}
        tests={tests || []}
        globalLeaderboard={processedGlobalLeaderboard}
        weeklyLeaderboard={processedWeeklyLeaderboard}
        monthlyLeaderboard={processedMonthlyLeaderboard}
        userGlobalRank={userGlobalRank}
        userWeeklyRank={userWeeklyRank}
        userMonthlyRank={userMonthlyRank}
      />
    </DashboardShell>
  )
}
