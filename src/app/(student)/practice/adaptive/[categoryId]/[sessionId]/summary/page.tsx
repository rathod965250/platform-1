import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeSummary } from '@/components/practice/PracticeSummary'

export const metadata = {
  title: 'Practice Summary | Aptitude Preparation Platform',
  description: 'View your practice session results and analytics',
}

interface PageProps {
  params: Promise<{
    categoryId: string
    sessionId: string
  }>
}

export default async function PracticeSummaryPage({ params }: PageProps) {
  const { categoryId, sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch session
  const { data: session } = await supabase
    .from('practice_sessions')
    .select(`
      *,
      category:categories(name, slug)
    `)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    redirect('/practice')
  }

  // Calculate analytics if not already done
  const { data: existingStats } = await supabase
    .from('session_stats')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  let sessionStats = existingStats

  // If stats don't exist, trigger calculation
  if (!sessionStats) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const { data: { session: authSession } } = await supabase.auth.getSession()

      const response = await fetch(`${supabaseUrl}/functions/v1/calculate-session-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession?.access_token || supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id,
        }),
      })

      if (response.ok) {
        const statsData = await response.json()
        // Fetch the created stats
        const { data: newStats } = await supabase
          .from('session_stats')
          .select('*')
          .eq('session_id', sessionId)
          .single()
        sessionStats = newStats || statsData.stats
      }
    } catch (error) {
      console.error('Error calculating session stats:', error)
    }
  }

  // Fetch recommendations
  let recommendations = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const { data: { session: authSession } } = await supabase.auth.getSession()

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-ai-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession?.access_token || supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        user_id: user.id,
        category_id: categoryId,
      }),
    })

    if (response.ok) {
      const recData = await response.json()
      recommendations = recData.recommendations || []
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error)
  }

  // Fetch metrics for detailed breakdown with question_topic
  const { data: metrics, error: metricsError } = await supabase
    .from('user_metrics')
    .select(`
      *,
      question:questions("question text", question_type, question_topic, difficulty, explanation, "correct answer"),
      subcategory:subcategories(name)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  // Debug logging
  console.log('=== SUMMARY PAGE DATA FETCH ===')
  console.log('Session ID:', sessionId)
  console.log('Metrics count:', metrics?.length || 0)
  console.log('Metrics error:', metricsError)
  console.log('Session data:', {
    total_questions: session.total_questions,
    correct_answers: session.correct_answers,
    incorrect_answers: session.incorrect_answers,
    skipped_count: session.skipped_count,
  })
  
  if (metrics && metrics.length > 0) {
    console.log('Sample metric:', metrics[0])
    console.log('Metrics with is_correct:', metrics.filter((m: any) => m.is_correct !== null).length)
  } else {
    console.warn('⚠️ NO METRICS FOUND FOR SESSION:', sessionId)
    console.warn('This means answers were not saved to user_metrics table')
  }

  // Calculate weak area analysis based on question_topic
  const weakAreas: Array<{
    topic: string
    incorrectCount: number
    correctCount: number
    totalAttempted: number
    accuracy: number
    errorPercentage: number
  }> = []

  if (metrics && metrics.length > 0) {
    const topicStats = new Map<string, { incorrect: number; correct: number; total: number }>()
    
    metrics.forEach((metric: any) => {
      if (metric.is_correct !== null && metric.question?.question_topic) {
        const topic = metric.question.question_topic
        const current = topicStats.get(topic) || { incorrect: 0, correct: 0, total: 0 }
        
        current.total += 1
        if (metric.is_correct) {
          current.correct += 1
        } else {
          current.incorrect += 1
        }
        
        topicStats.set(topic, current)
      }
    })

    // Calculate accuracy and error percentage for each topic
    const totalErrors = metrics.filter((m: any) => m.is_correct === false).length
    
    topicStats.forEach((stats, topic) => {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      const errorPercentage = totalErrors > 0 ? (stats.incorrect / totalErrors) * 100 : 0
      
      if (stats.incorrect > 0) {
        weakAreas.push({
          topic,
          incorrectCount: stats.incorrect,
          correctCount: stats.correct,
          totalAttempted: stats.total,
          accuracy,
          errorPercentage,
        })
      }
    })

    // Sort by incorrect count (descending) and accuracy (ascending) to get top weak areas
    weakAreas.sort((a, b) => {
      if (b.incorrectCount !== a.incorrectCount) {
        return b.incorrectCount - a.incorrectCount
      }
      return a.accuracy - b.accuracy
    })
  }

  // Calculate additional statistics
  // Handle both boolean and null values for is_correct
  const attemptedCount = metrics?.filter((m: any) => m.is_correct !== null && m.is_correct !== undefined).length || 0
  const notAttemptedCount = Math.max(0, (session.total_questions || metrics?.length || 0) - attemptedCount)
  const skippedCount = session.skipped_count || 0
  // Check for both boolean false and explicit false values
  const incorrectCount = metrics?.filter((m: any) => m.is_correct === false || m.is_correct === 0).length || 0
  // Check for both boolean true and explicit true values
  const correctCount = metrics?.filter((m: any) => m.is_correct === true || m.is_correct === 1).length || 0
  
  // Fallback: If metrics are empty but session has data, use session data
  const finalCorrectCount = correctCount > 0 ? correctCount : (session.correct_answers || 0)
  const finalIncorrectCount = incorrectCount > 0 ? incorrectCount : (session.incorrect_answers || 0)
  const finalAttemptedCount = attemptedCount > 0 ? attemptedCount : (finalCorrectCount + finalIncorrectCount)
  const finalSkippedCount = skippedCount > 0 ? skippedCount : (session.skipped_count || 0)
  const finalNotAttemptedCount = Math.max(0, (session.total_questions || 0) - finalAttemptedCount - finalSkippedCount)
  
  console.log('=== CALCULATED STATISTICS ===')
  console.log('From metrics:', { correctCount, incorrectCount, attemptedCount })
  console.log('From session:', { 
    correct_answers: session.correct_answers, 
    incorrect_answers: session.incorrect_answers,
    total_questions: session.total_questions 
  })
  console.log('Final values:', { 
    finalCorrectCount, 
    finalIncorrectCount, 
    finalAttemptedCount,
    finalSkippedCount,
    finalNotAttemptedCount
  })
  
  // Get mastery progression
  const masteryProgression = metrics
    ?.filter((m: any) => m.mastery_score_before !== null || m.mastery_score_after !== null)
    .map((m: any) => ({
      before: m.mastery_score_before,
      after: m.mastery_score_after,
      timestamp: m.created_at,
    })) || []

  // Get final mastery score
  const finalMastery = masteryProgression.length > 0 
    ? masteryProgression[masteryProgression.length - 1].after 
    : sessionStats?.avg_accuracy ? sessionStats.avg_accuracy / 100 : 0.5

  // Get starting mastery score
  const startingMastery = masteryProgression.length > 0 
    ? masteryProgression[0].before 
    : 0.5

  return (
    <PracticeSummary
      session={session}
      sessionStats={sessionStats}
      metrics={metrics || []}
      recommendations={recommendations}
      categoryId={categoryId}
      weakAreas={weakAreas.slice(0, 5)} // Top 5 weak areas
      attemptedCount={finalAttemptedCount}
      notAttemptedCount={finalNotAttemptedCount}
      skippedCount={finalSkippedCount}
      incorrectCount={finalIncorrectCount}
      correctCount={finalCorrectCount}
      finalMastery={finalMastery}
      startingMastery={startingMastery}
      masteryChange={finalMastery - startingMastery}
    />
  )
}

