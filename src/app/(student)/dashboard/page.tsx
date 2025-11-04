import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import type { TestAttemptWithRelations, AdaptiveStateWithRelations } from '@/types/database.types'

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

  // Fetch user profile including dashboard preferences and avatar_url
  // Note: Onboarding check is handled by middleware, so we can skip it here to avoid duplicate queries
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Parse dashboard preferences with defaults
  const defaultPreferences = {
    showRankCards: true,
    showProgressTracking: true,
    showAchievementBadges: true,
    showImprovementTrends: true,
    showPeerComparison: true,
    showRecommendations: true,
    showPerformanceTrend: true,
    showWeakAreas: true,
  }
  const dashboardPreferences = profile?.dashboard_preferences 
    ? { ...defaultPreferences, ...(profile.dashboard_preferences as any) }
    : defaultPreferences

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
        // Safe null check for test relation
        const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
        if (!test || typeof test !== 'object' || !('total_marks' in test) || !test.total_marks) {
          return sum // Skip if test data is missing
        }
        const totalMarks = typeof test.total_marks === 'number' ? test.total_marks : 0
        if (totalMarks === 0) return sum
        const percentage = (attempt.score / totalMarks) * 100
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
    ...(testAttempts?.slice(0, 3).map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      return {
        type: 'test' as const,
        id: attempt.id,
        title: (testObj && 'title' in testObj ? String(testObj.title) : 'Test'),
        date: attempt.submitted_at || new Date().toISOString(), // Safe fallback
        score: attempt.score,
        totalMarks: (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100),
        testId: (testObj && 'id' in testObj ? String(testObj.id) : undefined) || undefined,
      }
    }) || []),
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
  const performanceTrend = testAttempts?.slice(0, 10).reverse().map((attempt, index) => {
    const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
    const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
    const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100) // Safe fallback
    const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
    return {
      index: index + 1,
      score: percentage.toFixed(1),
      date: new Date(attempt.submitted_at || new Date().toISOString()).toLocaleDateString(), // Safe fallback
    }
  }) || []

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
  
  // Fetch all attempt answers in a single query instead of looping
  if (testAttempts && testAttempts.length > 0) {
    const attemptIds = testAttempts.map(attempt => attempt.id)
    const { data: allAnswers } = await supabase
      .from('attempt_answers')
      .select(`
        is_correct,
        attempt_id,
        question:questions(
          subcategory:subcategories(
            category:categories(name)
          )
        )
      `)
      .in('attempt_id', attemptIds)

    // Process answers in-memory
    allAnswers?.forEach((answer) => {
      // Safe navigation for nested relations
      const question = Array.isArray(answer.question) ? answer.question[0] : answer.question
      const questionObj = question && typeof question === 'object' && !Array.isArray(question) ? question : null
      const subcategory = questionObj && 'subcategory' in questionObj ? (Array.isArray(questionObj.subcategory) ? questionObj.subcategory[0] : questionObj.subcategory) : null
      const subcategoryObj = subcategory && typeof subcategory === 'object' && !Array.isArray(subcategory) ? subcategory : null
      const category = subcategoryObj && 'category' in subcategoryObj ? (Array.isArray(subcategoryObj.category) ? subcategoryObj.category[0] : subcategoryObj.category) : null
      const categoryObj = category && typeof category === 'object' && !Array.isArray(category) ? category : null
      const categoryName = (categoryObj && 'name' in categoryObj ? String(categoryObj.name) : 'Other')
      if (!categoryPerformance[categoryName]) {
        categoryPerformance[categoryName] = { correct: 0, total: 0 }
      }
      categoryPerformance[categoryName].total += 1
      if (answer.is_correct) {
        categoryPerformance[categoryName].correct += 1
      }
    })
  }

  // Also check adaptive states for mastery scores
  adaptiveStates?.forEach((state) => {
    const categoryName = state.category?.name || 'Other'
    const mastery = typeof state.mastery_score === 'number' 
      ? state.mastery_score 
      : parseFloat(String(state.mastery_score || 0))
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
  adaptiveStates?.forEach((state) => {
    const categoryName = state.category?.name || 'Other'
    const mastery = typeof state.mastery_score === 'number'
      ? state.mastery_score
      : parseFloat(String(state.mastery_score || 0))
    if (mastery < 0.4 && !weakAreas.includes(categoryName)) {
      weakAreas.push(categoryName)
    }
  })

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

  // ============================================
  // MOTIVATIONAL DATA FETCHING
  // ============================================

  // Fetch all test attempts for leaderboard ranking (limit to recent for performance)
  const { data: allTestAttempts } = await supabase
    .from('test_attempts')
    .select(`
      id,
      user_id,
      score,
      total_questions,
      submitted_at,
      test:tests(total_marks)
    `)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(1000) // Limit to recent 1000 attempts for performance

  // Calculate global leaderboard ranks
  const globalLeaderboard = allTestAttempts
    ?.map(attempt => {
      const totalMarks = attempt.test?.total_marks || 100
      const percentage = (attempt.score / totalMarks) * 100
      return {
        userId: attempt.user_id,
        score: attempt.score,
        percentage,
        submittedAt: attempt.submitted_at,
      }
    })
    .sort((a, b) => b.percentage - a.percentage) || []

  // Get unique users count for percentile
  const uniqueUsers = new Set(globalLeaderboard.map(entry => entry.userId))
  const totalUsers = uniqueUsers.size

  // Find user's global rank
  const userGlobalRank = globalLeaderboard.findIndex(entry => entry.userId === user.id) + 1
  const userGlobalRankFinal = userGlobalRank > 0 ? userGlobalRank : 0

  // Calculate weekly leaderboard (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weeklyLeaderboard = globalLeaderboard
    .filter(entry => entry.submittedAt && new Date(entry.submittedAt) >= new Date(weekAgo))
    .sort((a, b) => b.percentage - a.percentage)

  const userWeeklyRank = weeklyLeaderboard.findIndex(entry => entry.userId === user.id) + 1
  const userWeeklyRankFinal = userWeeklyRank > 0 ? userWeeklyRank : 0

  // Calculate monthly leaderboard (last 30 days)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const monthlyLeaderboard = globalLeaderboard
    .filter(entry => entry.submittedAt && new Date(entry.submittedAt) >= new Date(monthAgo))
    .sort((a, b) => b.percentage - a.percentage)

  const userMonthlyRank = monthlyLeaderboard.findIndex(entry => entry.userId === user.id) + 1
  const userMonthlyRankFinal = userMonthlyRank > 0 ? userMonthlyRank : 0

  // Calculate week-over-week improvement
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const currentWeekScores = testAttempts
    ?.filter(a => a.submitted_at && new Date(a.submitted_at) >= new Date(weekAgo))
    .map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
      return totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
    }) || []

  const previousWeekScores = testAttempts
    ?.filter(a => {
      if (!a.submitted_at) return false
      const submittedDate = new Date(a.submitted_at)
      return submittedDate >= new Date(twoWeeksAgo) && submittedDate < new Date(weekAgo)
    })
    .map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
      return totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
    }) || []

  const currentWeekAvg = currentWeekScores.length > 0
    ? currentWeekScores.reduce((sum, score) => sum + score, 0) / currentWeekScores.length
    : 0

  const previousWeekAvg = previousWeekScores.length > 0
    ? previousWeekScores.reduce((sum, score) => sum + score, 0) / previousWeekScores.length
    : 0

  const weekOverWeekImprovement = previousWeekAvg > 0
    ? ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
    : currentWeekAvg > 0 ? 100 : 0

  // Calculate best score
  const bestScore = testAttempts
    ?.map(attempt => {
      const test = Array.isArray(attempt.test) ? attempt.test[0] : attempt.test
      const testObj = test && typeof test === 'object' && !Array.isArray(test) ? test : null
      const totalMarks = (testObj && 'total_marks' in testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
      return totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0
    })
    .reduce((max, score) => Math.max(max, score), 0) || 0

  // Calculate longest streak from user_analytics
  const { data: userAnalytics } = await supabase
    .from('user_analytics')
    .select('current_streak_days')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  const longestStreak = userAnalytics?.[0]?.current_streak_days || currentStreak

  // Calculate progress to next milestone (using questions)
  const nextQuestionMilestone = [50, 100, 250, 500, 1000, 2500].find(m => m > totalQuestionsAnswered) || 2500
  const progressToNextMilestone = {
    current: totalQuestionsAnswered,
    target: nextQuestionMilestone,
    percentage: Math.min((totalQuestionsAnswered / nextQuestionMilestone) * 100, 100),
    label: `Questions completed: ${totalQuestionsAnswered}/${nextQuestionMilestone}`
  }

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
        userGlobalRank={userGlobalRankFinal}
        userWeeklyRank={userWeeklyRankFinal}
        userMonthlyRank={userMonthlyRankFinal}
        totalUsers={totalUsers}
        weekOverWeekImprovement={weekOverWeekImprovement}
        bestScore={bestScore}
        longestStreak={longestStreak}
        progressToNextMilestone={progressToNextMilestone}
        dashboardPreferences={dashboardPreferences}
      />
    </Suspense>
  )
}
