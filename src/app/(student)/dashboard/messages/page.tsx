import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { MessagesContent } from '@/components/dashboard/MessagesContent'
import { sanitizeSupabaseResult, extractRelationship } from '@/lib/supabase/utils'

export const metadata = {
  title: 'My Messages | Aptitude Preparation Platform',
  description: 'View your contact form submissions and replies from the CrackAtom team',
}

export default async function MyMessagesPage() {
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
      test:tests(id, title, total_marks)
    `)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

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
        const test = extractRelationship(attempt.test)
        const testObj = test && typeof test === 'object' && 'total_marks' in test ? test : null
        const totalMarks = (testObj && typeof testObj.total_marks === 'number' ? testObj.total_marks : 100)
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
      const test = extractRelationship(attempt.test)
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
    const test = extractRelationship(attempt.test)
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
      category:categories(name, id)
    `)
    .eq('user_id', user.id)

  // Sanitize adaptiveStates - filter out Supabase metadata and ensure proper data structure
  const adaptiveStates = sanitizeSupabaseResult(adaptiveStatesRaw || []).map((state: any) => {
    // Extract category relationship safely
    const category = extractRelationship(state.category)
    return {
      ...state,
      category: category && typeof category === 'object' && 'name' in category 
        ? { name: category.name, id: category.id } 
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

  // Analyze weak areas from test attempts and adaptive states
  const categoryPerformance: Record<string, { correct: number; total: number }> = {}
  
  // Fetch all attempt answers in a single query instead of looping
  if (testAttempts && testAttempts.length > 0) {
    const attemptIds = testAttempts.map(attempt => attempt.id)
    const { data: allAnswersRaw } = await supabase
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

    // Sanitize answers - filter out Supabase metadata from nested relationships
    const allAnswers = sanitizeSupabaseResult(allAnswersRaw || []).map((answer: any) => {
      const question = extractRelationship(answer.question)
      if (question && typeof question === 'object') {
        const subcategory = extractRelationship(question.subcategory)
        if (subcategory && typeof subcategory === 'object') {
          const category = extractRelationship(subcategory.category)
          return {
            ...answer,
            question: {
              subcategory: {
                category: category && typeof category === 'object' && 'name' in category
                  ? { name: category.name }
                  : null,
              },
            },
          }
        }
        return {
          ...answer,
          question: {
            subcategory: subcategory && typeof subcategory === 'object'
              ? subcategory
              : null,
          },
        }
      }
      return {
        ...answer,
        question: question && typeof question === 'object' ? question : null,
      }
    })

    // Process answers in-memory
    allAnswers.forEach((answer) => {
      const question = answer.question
      if (question && question.subcategory && question.subcategory.category) {
        const category = question.subcategory.category
        const categoryName = (category && typeof category === 'object' && 'name' in category && !('cardinality' in category))
          ? String(category.name)
          : 'Other'
        if (!categoryPerformance[categoryName]) {
          categoryPerformance[categoryName] = { correct: 0, total: 0 }
        }
        categoryPerformance[categoryName].total += 1
        if (answer.is_correct) {
          categoryPerformance[categoryName].correct += 1
        }
      }
    })
  }

  // Also check adaptive states for mastery scores
  adaptiveStates?.forEach((state) => {
    const categoryName = state.category?.name || 'Other'
    const mastery = typeof state.mastery_score === 'number'
      ? state.mastery_score
      : parseFloat(String(state.mastery_score || 0))
    if (mastery < 40 && !categoryPerformance[categoryName]) {
      categoryPerformance[categoryName] = { correct: 0, total: 0 }
    }
  })

  // Identify weak areas (accuracy < 60% or mastery < 40%)
  const weakAreasArray: string[] = []
  Object.entries(categoryPerformance).forEach(([categoryName, stats]) => {
    const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    const mastery = masteryLevels[categoryName] || 0
    if (accuracy < 60 || mastery < 40) {
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
      if (mastery < 40 && !weakAreasArray.includes(categoryName)) {
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
      <MessagesContent />
    </DashboardShell>
  )
}
