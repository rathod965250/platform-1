import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { PracticeStats } from '@/components/practice/PracticeStats'
import { PracticeCategoryCard } from '@/components/practice/PracticeCategoryCard'
import { RecentSessions } from '@/components/practice/RecentSessions'
import { PerformanceHighlights } from '@/components/practice/PerformanceHighlights'
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Adaptive Practice
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
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
          <div className="mb-8">
            <RecentSessions sessions={recentSessionsWithCategories} isLoading={false} />
          </div>
        )}

        {/* Performance Highlights */}
        {(strengths.length > 0 || weakAreas.length > 0) && (
          <div className="mb-8">
            <PerformanceHighlights
              strengths={strengths}
              weakAreas={weakAreas}
              isLoading={false}
            />
          </div>
        )}

        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Practice Progress
          </h2>

          {/* Fetch category performance metrics */}
          {(() => {
            // We'll fetch category metrics per category (simplified for now)
            // In production, this could be optimized with a single query
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  )
}

