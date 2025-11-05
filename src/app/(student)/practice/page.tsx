import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { PracticeStats } from '@/components/practice/PracticeStats'
import { PracticeCategoryCard } from '@/components/practice/PracticeCategoryCard'
import { RecentSessions } from '@/components/practice/RecentSessions'
import { PerformanceHighlights } from '@/components/practice/PerformanceHighlights'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Adaptive Practice | Aptitude Preparation Platform',
  description: 'AI-powered adaptive practice with personalized difficulty adjustment',
}

function PracticeStatsLoading() {
  return (
    <PracticeStats
      totalQuestions={0}
      accuracy={0}
      streak={0}
      mastery={0}
      isLoading={true}
    />
  )
}

export default async function PracticePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch categories with adaptive states
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(count)
    `)
    .order('order', { ascending: true })

  // Fetch user's adaptive states
  const { data: adaptiveStates } = await supabase
    .from('adaptive_state')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('user_id', user.id)

  // Fetch user analytics for overall stats
  const { data: userAnalytics } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  // Fetch practice sessions for total questions count and recent sessions
  const { data: practiceSessions } = await supabase
    .from('practice_sessions')
    .select(`
      id,
      total_questions,
      correct_answers,
      completed_at,
      created_at,
      category:tests(
        category_id
      ),
      category_id
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // Fetch recent sessions with category names
  const recentSessionsWithCategories = await Promise.all(
    (practiceSessions?.slice(0, 5) || []).map(async (session) => {
      const categoryId = session.category_id
      if (!categoryId) {
        return {
          id: session.id,
          category_id: undefined,
          category_name: 'Unknown',
          total_questions: session.total_questions || 0,
          correct_answers: session.correct_answers || 0,
          completed_at: session.completed_at || session.created_at,
          created_at: session.created_at,
        }
      }

      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single()

      return {
        id: session.id,
        category_id: categoryId,
        category_name: category?.name || 'Unknown',
        total_questions: session.total_questions || 0,
        correct_answers: session.correct_answers || 0,
        completed_at: session.completed_at || session.created_at,
        created_at: session.created_at,
      }
    })
  )

  // Fetch user metrics for accuracy calculation
  const { data: userMetrics } = await supabase
    .from('user_metrics')
    .select('is_correct')
    .eq('user_id', user.id)
    .limit(1000) // Limit for performance

  // Calculate overall statistics
  const totalQuestions = practiceSessions?.reduce((sum, session) => sum + (session.total_questions || 0), 0) || 0
  const totalCorrect = practiceSessions?.reduce((sum, session) => sum + (session.correct_answers || 0), 0) || 0
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

  // Calculate overall mastery (average of all adaptive states)
  const masteryScores = adaptiveStates?.map(state => {
    const score = typeof state.mastery_score === 'number' 
      ? state.mastery_score 
      : parseFloat(String(state.mastery_score || 0))
    return score
  }) || []
  const overallMastery = masteryScores.length > 0
    ? masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length
    : 0

  // Get current streak from user analytics
  const currentStreak = userAnalytics?.[0]?.current_streak_days || 0

  // Build adaptive state map for quick lookup
  const adaptiveStateMap = new Map(
    adaptiveStates?.map(state => [state.category_id, state]) || []
  )

  // Fetch user metrics for category performance calculation
  const { data: allUserMetrics } = await supabase
    .from('user_metrics')
    .select(`
      is_correct,
      question:questions(
        subcategory:subcategories(
          category_id
        )
      )
    `)
    .eq('user_id', user.id)
    .limit(5000) // Limit for performance

  // Calculate category-wise performance
  const categoryPerformanceMap = new Map<string, { correct: number; total: number }>()
  
  allUserMetrics?.forEach((metric) => {
    const categoryId = metric.question?.subcategory?.category_id
    if (categoryId) {
      const current = categoryPerformanceMap.get(categoryId) || { correct: 0, total: 0 }
      current.total += 1
      if (metric.is_correct) {
        current.correct += 1
      }
      categoryPerformanceMap.set(categoryId, current)
    }
  })

  // Build strengths and weak areas
  const categoryPerformance: Array<{
    category_id: string
    category_name: string
    mastery_score: number
    accuracy: number
    total_questions: number
  }> = []

      categories?.forEach((category) => {
        const state = adaptiveStateMap.get(category.id)
        const metrics = categoryPerformanceMap.get(category.id)
        
        const mastery = state
          ? typeof state.mastery_score === 'number'
            ? state.mastery_score
            : parseFloat(String(state.mastery_score || 0))
          : 0

    const accuracy = metrics && metrics.total > 0
      ? (metrics.correct / metrics.total) * 100
      : 0

    categoryPerformance.push({
      category_id: category.id,
      category_name: category.name,
      mastery_score: mastery,
      accuracy: accuracy,
      total_questions: metrics?.total || 0,
    })
  })

  // Sort by mastery score - only show if there's actual data
  const strengths = [...categoryPerformance]
    .filter(cat => cat.mastery_score >= 0.6 && cat.total_questions >= 5 && cat.mastery_score > 0)
    .sort((a, b) => b.mastery_score - a.mastery_score)
    .slice(0, 3)

  const weakAreas = [...categoryPerformance]
    .filter(cat => (cat.mastery_score < 0.5 || cat.accuracy < 60) && cat.total_questions >= 1)
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 3)

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

  // Calculate stats for DashboardShell
  const totalTests = testAttempts?.length || 0
  const totalQuestionsAnswered = (testAttempts?.reduce((sum, attempt) => sum + attempt.total_questions, 0) || 0) + totalQuestions

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
      score: session.correct_answers,
      totalMarks: session.total_questions,
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

  // Weak areas array for DashboardShell
  const weakAreasArray = weakAreas.map(cat => cat.category_name)

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
        {/* Hero Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
            <div className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans leading-tight break-words">
                Adaptive Practice
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
                AI-powered practice that adjusts difficulty based on your performance
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <Suspense fallback={<PracticeStatsLoading />}>
            <PracticeStats
              totalQuestions={totalQuestions}
              accuracy={accuracy}
              streak={currentStreak}
              mastery={overallMastery}
              isLoading={false}
            />
          </Suspense>
        </div>

        {/* Recent Sessions Section */}
        {recentSessionsWithCategories.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <RecentSessions sessions={recentSessionsWithCategories} isLoading={false} />
          </div>
        )}

        {/* Performance Highlights */}
        {(strengths.length > 0 || weakAreas.length > 0) && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <PerformanceHighlights
              strengths={strengths}
              weakAreas={weakAreas}
              isLoading={false}
            />
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 md:mb-5 font-sans">
            Your Practice Progress
          </h2>

          {/* Fetch category performance metrics */}
          {(() => {
            // We'll fetch category metrics per category (simplified for now)
            // In production, this could be optimized with a single query
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {categories?.map((category) => {
                  const state = adaptiveStateMap.get(category.id)
                  
                  // Map category name to icon name (plain string)
                  const iconNameMap: Record<string, string> = {
                    'Quantitative Aptitude': 'Calculator',
                    'Logical Reasoning': 'Brain',
                    'Verbal Ability': 'BookOpen',
                    'Data Interpretation': 'BarChart3',
                    'Problem Solving': 'Lightbulb',
                  }
                  const iconName = iconNameMap[category.name] || 'Brain'
                  
                  // Get category performance metrics
                  const catMetrics = categoryPerformanceMap.get(category.id)
                  
                  return (
                    <PracticeCategoryCard
                      key={category.id}
                      category={category}
                      iconName={iconName}
                      adaptiveState={state || undefined}
                      totalQuestions={catMetrics?.total || 0}
                      categoryAccuracy={catMetrics && catMetrics.total > 0
                        ? (catMetrics.correct / catMetrics.total) * 100
                        : (state && state.recent_accuracy && state.recent_accuracy.length > 0
                          ? state.recent_accuracy.reduce((sum, acc) => sum + parseFloat(String(acc || 0)), 0) / state.recent_accuracy.length
                          : 0)}
                      lastPracticeDate={null} // Could be fetched from practice_sessions
                    />
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>
      </div>
    </DashboardShell>
  )
}

