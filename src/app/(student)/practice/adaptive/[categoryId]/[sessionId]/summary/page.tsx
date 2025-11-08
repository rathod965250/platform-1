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

  // Fetch session summary (Enhanced End Session Dialog data)
  const { data: sessionSummary, error: summaryError } = await supabase
    .from('session_summary')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (summaryError) {
    console.warn('⚠️ Session summary not found:', summaryError)
  } else {
    console.log('✅ Session summary fetched:', sessionSummary)
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

  // Fetch user progress summary (efficient single query)
  const { data: progressSummary } = await supabase
    .from('user_progress_summary')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .single()

  console.log('✅ Progress summary fetched:', progressSummary ? 'Available' : 'Not found')

  // Fallback: Fetch historical data if progress summary doesn't exist
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: practiceHistory } = await supabase
    .from('practice_sessions')
    .select('id, created_at, correct_answers, incorrect_answers, total_questions, time_taken_seconds')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch historical weak topics from user_metrics (only if no progress summary)
  const { data: historicalMetrics } = !progressSummary ? await supabase
    .from('user_metrics')
    .select(`
      is_correct,
      question:questions(question_topic, difficulty)
    `)
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('is_correct', 'is', null) : { data: null }

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

  // Calculate comprehensive performance analysis by subcategory and topic
  const performanceAnalysis: Array<{
    subcategoryId: string | null
    subcategoryName: string
    topicName: string | null
    totalQuestions: number
    attemptedQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedQuestions: number
    accuracy: number
    errorRate: number
    totalTime: number
    avgTime: number
    easyTotal: number
    easyCorrect: number
    mediumTotal: number
    mediumCorrect: number
    hardTotal: number
    hardCorrect: number
    isStrongArea: boolean
    isWeakArea: boolean
    confidenceScore: number
  }> = []

  const weakAreas: Array<{
    topic: string
    incorrectCount: number
    correctCount: number
    totalAttempted: number
    accuracy: number
    errorPercentage: number
  }> = []

  const strongAreas: Array<{
    topic: string
    correctCount: number
    incorrectCount: number
    totalAttempted: number
    accuracy: number
    confidenceScore: number
  }> = []

  if (metrics && metrics.length > 0) {
    // Group by subcategory and topic
    const subcategoryStats = new Map<string, {
      subcategoryId: string | null
      subcategoryName: string
      topicName: string | null
      total: number
      attempted: number
      correct: number
      incorrect: number
      skipped: number
      totalTime: number
      easyTotal: number
      easyCorrect: number
      mediumTotal: number
      mediumCorrect: number
      hardTotal: number
      hardCorrect: number
    }>()
    
    metrics.forEach((metric: any) => {
      const subcategoryName = metric.subcategory?.name || 'Unknown'
      const subcategoryId = metric.subcategory_id || null
      const topicName = metric.question?.question_topic || null
      const key = `${subcategoryId || 'unknown'}_${topicName || 'general'}`
      
      const current = subcategoryStats.get(key) || {
        subcategoryId,
        subcategoryName,
        topicName,
        total: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        totalTime: 0,
        easyTotal: 0,
        easyCorrect: 0,
        mediumTotal: 0,
        mediumCorrect: 0,
        hardTotal: 0,
        hardCorrect: 0,
      }
      
      current.total += 1
      
      // Track difficulty
      const difficulty = (metric.difficulty || metric.question?.difficulty || 'medium').toLowerCase()
      if (difficulty === 'easy') {
        current.easyTotal += 1
      } else if (difficulty === 'medium') {
        current.mediumTotal += 1
      } else if (difficulty === 'hard') {
        current.hardTotal += 1
      }
      
      // Track attempts and correctness
      if (metric.is_correct !== null && metric.is_correct !== undefined) {
        current.attempted += 1
        current.totalTime += metric.time_taken_seconds || 0
        
        if (metric.is_correct === true || metric.is_correct === 1) {
          current.correct += 1
          if (difficulty === 'easy') current.easyCorrect += 1
          else if (difficulty === 'medium') current.mediumCorrect += 1
          else if (difficulty === 'hard') current.hardCorrect += 1
        } else {
          current.incorrect += 1
        }
      } else {
        current.skipped += 1
      }
      
      subcategoryStats.set(key, current)
    })

    // Calculate performance metrics and classify areas
    const totalErrors = metrics.filter((m: any) => m.is_correct === false).length
    
    subcategoryStats.forEach((stats, key) => {
      const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0
      const errorRate = stats.attempted > 0 ? (stats.incorrect / stats.attempted) * 100 : 0
      const avgTime = stats.attempted > 0 ? Math.round(stats.totalTime / stats.attempted) : 0
      
      // Calculate confidence score based on sample size
      // More questions = higher confidence
      const sampleSize = stats.attempted
      const confidenceScore = Math.min(1, sampleSize / 10) // Max confidence at 10+ questions
      
      // Classify as strong or weak area
      // Strong: >= 80% accuracy with at least 3 attempts
      // Weak: < 50% accuracy with at least 3 attempts
      const isStrongArea = accuracy >= 80 && sampleSize >= 3
      const isWeakArea = accuracy < 50 && sampleSize >= 3
      
      const analysis = {
        subcategoryId: stats.subcategoryId,
        subcategoryName: stats.subcategoryName,
        topicName: stats.topicName,
        totalQuestions: stats.total,
        attemptedQuestions: stats.attempted,
        correctAnswers: stats.correct,
        incorrectAnswers: stats.incorrect,
        skippedQuestions: stats.skipped,
        accuracy,
        errorRate,
        totalTime: stats.totalTime,
        avgTime,
        easyTotal: stats.easyTotal,
        easyCorrect: stats.easyCorrect,
        mediumTotal: stats.mediumTotal,
        mediumCorrect: stats.mediumCorrect,
        hardTotal: stats.hardTotal,
        hardCorrect: stats.hardCorrect,
        isStrongArea,
        isWeakArea,
        confidenceScore,
      }
      
      performanceAnalysis.push(analysis)
      
      // Add to weak areas if applicable
      if (stats.incorrect > 0) {
        const errorPercentage = totalErrors > 0 ? (stats.incorrect / totalErrors) * 100 : 0
        weakAreas.push({
          topic: stats.topicName || stats.subcategoryName,
          incorrectCount: stats.incorrect,
          correctCount: stats.correct,
          totalAttempted: stats.attempted,
          accuracy,
          errorPercentage,
        })
      }
      
      // Add to strong areas if applicable
      if (isStrongArea) {
        strongAreas.push({
          topic: stats.topicName || stats.subcategoryName,
          correctCount: stats.correct,
          incorrectCount: stats.incorrect,
          totalAttempted: stats.attempted,
          accuracy,
          confidenceScore,
        })
      }
    })

    // Sort weak areas by error rate and incorrect count
    weakAreas.sort((a, b) => {
      if (b.incorrectCount !== a.incorrectCount) {
        return b.incorrectCount - a.incorrectCount
      }
      return a.accuracy - b.accuracy
    })
    
    // Sort strong areas by accuracy and confidence
    strongAreas.sort((a, b) => {
      if (Math.abs(b.accuracy - a.accuracy) > 5) {
        return b.accuracy - a.accuracy
      }
      return b.confidenceScore - a.confidenceScore
    })
    
    // Save performance analysis to database
    if (performanceAnalysis.length > 0) {
      try {
        const analysisRecords = performanceAnalysis.map(analysis => ({
          user_id: user.id,
          session_id: sessionId,
          category_id: categoryId,
          subcategory_id: analysis.subcategoryId,
          topic_name: analysis.topicName,
          total_questions: analysis.totalQuestions,
          attempted_questions: analysis.attemptedQuestions,
          correct_answers: analysis.correctAnswers,
          incorrect_answers: analysis.incorrectAnswers,
          skipped_questions: analysis.skippedQuestions,
          accuracy_percentage: analysis.accuracy,
          error_rate: analysis.errorRate,
          total_time_seconds: analysis.totalTime,
          avg_time_seconds: analysis.avgTime,
          easy_total: analysis.easyTotal,
          easy_correct: analysis.easyCorrect,
          medium_total: analysis.mediumTotal,
          medium_correct: analysis.mediumCorrect,
          hard_total: analysis.hardTotal,
          hard_correct: analysis.hardCorrect,
          is_strong_area: analysis.isStrongArea,
          is_weak_area: analysis.isWeakArea,
          confidence_score: analysis.confidenceScore,
        }))
        
        await supabase.from('performance_analysis').insert(analysisRecords)
        console.log('✅ Performance analysis saved:', analysisRecords.length, 'records')
      } catch (error) {
        console.error('❌ Error saving performance analysis:', error)
      }
    }
    
    // Update performance_analysis with granular question_topic insights and mastery tracking
    // This uses the same table for both per-session and lifetime tracking via upsert
    if (metrics && metrics.length > 0) {
      try {
        const topicMasteryMap = new Map<string, {
          correct: number
          incorrect: number
          skipped: number
          totalTime: number
          easyAttempts: number
          easyCorrect: number
          mediumAttempts: number
          mediumCorrect: number
          hardAttempts: number
          hardCorrect: number
          lastAttempted: string
          lastCorrect: string | null
          streak: number
          bestTime: number | null
        }>()
        
        let currentStreak = 0
        
        metrics.forEach((metric: any) => {
          const topicName = metric.question?.question_topic
          if (!topicName) return
          
          const current = topicMasteryMap.get(topicName) || {
            correct: 0,
            incorrect: 0,
            skipped: 0,
            totalTime: 0,
            easyAttempts: 0,
            easyCorrect: 0,
            mediumAttempts: 0,
            mediumCorrect: 0,
            hardAttempts: 0,
            hardCorrect: 0,
            lastAttempted: metric.created_at,
            lastCorrect: null,
            streak: 0,
            bestTime: null,
          }
          
          const difficulty = (metric.difficulty || metric.question?.difficulty || 'medium').toLowerCase()
          const timeTaken = metric.time_taken_seconds || 0
          
          // Track difficulty attempts
          if (difficulty === 'easy') current.easyAttempts++
          else if (difficulty === 'medium') current.mediumAttempts++
          else if (difficulty === 'hard') current.hardAttempts++
          
          // Track correctness
          if (metric.is_correct === true || metric.is_correct === 1) {
            current.correct++
            current.lastCorrect = metric.created_at
            currentStreak++
            current.streak = Math.max(current.streak, currentStreak)
            
            if (difficulty === 'easy') current.easyCorrect++
            else if (difficulty === 'medium') current.mediumCorrect++
            else if (difficulty === 'hard') current.hardCorrect++
            
            // Track best time
            if (timeTaken > 0) {
              current.bestTime = current.bestTime === null ? timeTaken : Math.min(current.bestTime, timeTaken)
            }
          } else if (metric.is_correct === false || metric.is_correct === 0) {
            current.incorrect++
            currentStreak = 0
          } else {
            current.skipped++
            currentStreak = 0
          }
          
          current.totalTime += timeTaken
          current.lastAttempted = metric.created_at
          
          topicMasteryMap.set(topicName, current)
        })
        
        // Upsert performance_analysis records for lifetime tracking
        for (const [topicName, stats] of topicMasteryMap.entries()) {
          const totalAttempts = stats.correct + stats.incorrect
          const accuracy = totalAttempts > 0 ? (stats.correct / totalAttempts) * 100 : 0
          const avgTime = totalAttempts > 0 ? Math.round(stats.totalTime / totalAttempts) : 0
          
          // Extract topic category and type from topic_name
          // e.g., "Time and Distance - Bus Speed System Problem"
          const parts = topicName.split(' - ')
          const topicCategory = parts[0]?.trim() || topicName
          const topicType = parts[1]?.trim() || null
          
          // Check if lifetime record exists for this user + topic
          const { data: existing } = await supabase
            .from('performance_analysis')
            .select('*')
            .eq('user_id', user.id)
            .eq('topic_name', topicName)
            .is('session_id', null) // Lifetime records have null session_id
            .single()
          
          if (existing) {
            // Update existing lifetime record
            const newTotalAttempts = existing.attempted_questions + totalAttempts
            const newTotalCorrect = existing.correct_answers + stats.correct
            const newAccuracy = newTotalAttempts > 0 ? (newTotalCorrect / newTotalAttempts) * 100 : 0
            const newLongestStreak = Math.max(existing.longest_streak || 0, stats.streak)
            
            // Calculate mastery level and score
            const { data: masteryLevel } = await supabase.rpc('calculate_mastery_level', {
              accuracy: newAccuracy,
              attempts: newTotalAttempts,
            })
            
            const { data: masteryScore } = await supabase.rpc('calculate_mastery_score', {
              accuracy: newAccuracy,
              attempts: newTotalAttempts,
              streak: newLongestStreak,
            })
            
            await supabase
              .from('performance_analysis')
              .update({
                total_questions: existing.total_questions + stats.correct + stats.incorrect + stats.skipped,
                attempted_questions: newTotalAttempts,
                correct_answers: newTotalCorrect,
                incorrect_answers: existing.incorrect_answers + stats.incorrect,
                skipped_questions: existing.skipped_questions + stats.skipped,
                accuracy_percentage: newAccuracy,
                error_rate: newTotalAttempts > 0 ? ((existing.incorrect_answers + stats.incorrect) / newTotalAttempts) * 100 : 0,
                total_time_seconds: existing.total_time_seconds + stats.totalTime,
                avg_time_seconds: Math.round((existing.total_time_seconds + stats.totalTime) / newTotalAttempts),
                easy_total: existing.easy_total + stats.easyAttempts,
                easy_correct: existing.easy_correct + stats.easyCorrect,
                medium_total: existing.medium_total + stats.mediumAttempts,
                medium_correct: existing.medium_correct + stats.mediumCorrect,
                hard_total: existing.hard_total + stats.hardAttempts,
                hard_correct: existing.hard_correct + stats.hardCorrect,
                is_strong_area: newAccuracy >= 80 && newTotalAttempts >= 3,
                is_weak_area: newAccuracy < 50 && newTotalAttempts >= 3,
                confidence_score: Math.min(1, newTotalAttempts / 10),
                mastery_level: masteryLevel || 'beginner',
                mastery_score: masteryScore || 0,
                current_streak: stats.correct === totalAttempts ? (existing.current_streak || 0) + stats.correct : 0,
                longest_streak: newLongestStreak,
                best_time_seconds: stats.bestTime !== null && existing.best_time_seconds !== null
                  ? Math.min(existing.best_time_seconds, stats.bestTime)
                  : stats.bestTime || existing.best_time_seconds,
                last_attempted_at: stats.lastAttempted,
                last_correct_at: stats.lastCorrect || existing.last_correct_at,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id)
          } else {
            // Insert new lifetime record (session_id = null for lifetime tracking)
            const { data: masteryLevel } = await supabase.rpc('calculate_mastery_level', {
              accuracy,
              attempts: totalAttempts,
            })
            
            const { data: masteryScore } = await supabase.rpc('calculate_mastery_score', {
              accuracy,
              attempts: totalAttempts,
              streak: stats.streak,
            })
            
            await supabase.from('performance_analysis').insert({
              user_id: user.id,
              session_id: null, // NULL for lifetime tracking
              category_id: categoryId,
              subcategory_id: metrics[0]?.subcategory_id || null,
              topic_name: topicName,
              topic_category: topicCategory,
              topic_type: topicType,
              total_questions: stats.correct + stats.incorrect + stats.skipped,
              attempted_questions: totalAttempts,
              correct_answers: stats.correct,
              incorrect_answers: stats.incorrect,
              skipped_questions: stats.skipped,
              accuracy_percentage: accuracy,
              error_rate: totalAttempts > 0 ? (stats.incorrect / totalAttempts) * 100 : 0,
              total_time_seconds: stats.totalTime,
              avg_time_seconds: avgTime,
              easy_total: stats.easyAttempts,
              easy_correct: stats.easyCorrect,
              medium_total: stats.mediumAttempts,
              medium_correct: stats.mediumCorrect,
              hard_total: stats.hardAttempts,
              hard_correct: stats.hardCorrect,
              is_strong_area: accuracy >= 80 && totalAttempts >= 3,
              is_weak_area: accuracy < 50 && totalAttempts >= 3,
              confidence_score: Math.min(1, totalAttempts / 10),
              mastery_level: masteryLevel || 'beginner',
              mastery_score: masteryScore || 0,
              current_streak: stats.correct === totalAttempts ? stats.correct : 0,
              longest_streak: stats.streak,
              best_time_seconds: stats.bestTime,
              last_attempted_at: stats.lastAttempted,
              last_correct_at: stats.lastCorrect,
            })
          }
        }
        
        console.log('✅ Performance analysis with mastery tracking updated:', topicMasteryMap.size, 'topics')
      } catch (error) {
        console.error('❌ Error updating performance analysis:', error)
      }
    }
  }

  // Calculate additional statistics
  // Prioritize session_summary data (from Enhanced End Session Dialog) if available
  let finalCorrectCount: number
  let finalIncorrectCount: number
  let finalAttemptedCount: number
  let finalSkippedCount: number
  let finalNotAttemptedCount: number
  let finalMarkedCount: number
  
  if (sessionSummary) {
    // Use Enhanced End Session Dialog data (most accurate)
    finalCorrectCount = sessionSummary.correct_count || 0
    finalIncorrectCount = sessionSummary.incorrect_count || 0
    finalAttemptedCount = sessionSummary.attempted_count || 0
    finalSkippedCount = sessionSummary.skipped_count || 0
    finalNotAttemptedCount = sessionSummary.unanswered_count || 0
    finalMarkedCount = sessionSummary.marked_count || 0
    
    console.log('✅ Using session_summary data (Enhanced End Session Dialog)')
  } else {
    // Fallback to calculating from metrics or session data
    const attemptedCount = metrics?.filter((m: any) => m.is_correct !== null && m.is_correct !== undefined).length || 0
    const notAttemptedCount = Math.max(0, (session.total_questions || metrics?.length || 0) - attemptedCount)
    const skippedCount = session.skipped_count || 0
    const incorrectCount = metrics?.filter((m: any) => m.is_correct === false || m.is_correct === 0).length || 0
    const correctCount = metrics?.filter((m: any) => m.is_correct === true || m.is_correct === 1).length || 0
    
    finalCorrectCount = correctCount > 0 ? correctCount : (session.correct_answers || 0)
    finalIncorrectCount = incorrectCount > 0 ? incorrectCount : (session.incorrect_answers || 0)
    finalAttemptedCount = attemptedCount > 0 ? attemptedCount : (finalCorrectCount + finalIncorrectCount)
    finalSkippedCount = skippedCount > 0 ? skippedCount : (session.skipped_count || 0)
    finalNotAttemptedCount = Math.max(0, (session.total_questions || 0) - finalAttemptedCount - finalSkippedCount)
    finalMarkedCount = 0 // Not available in fallback
    
    console.log('⚠️ Using fallback calculation (session_summary not available)')
  }
  
  console.log('=== CALCULATED STATISTICS ===')
  console.log('From session_summary:', sessionSummary ? {
    correct_count: sessionSummary.correct_count,
    incorrect_count: sessionSummary.incorrect_count,
    attempted_count: sessionSummary.attempted_count,
    skipped_count: sessionSummary.skipped_count,
    unanswered_count: sessionSummary.unanswered_count,
    marked_count: sessionSummary.marked_count,
  } : 'Not available')
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
    finalNotAttemptedCount,
    finalMarkedCount
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

  // Fetch lifetime topic mastery data from performance_analysis (where session_id is null)
  const topicNames = metrics
    ?.map((m: any) => m.question?.question_topic)
    .filter((t: string | null) => t !== null) || []
  
  const uniqueTopicNames = [...new Set(topicNames)]
  
  const { data: topicMasteryData } = await supabase
    .from('performance_analysis')
    .select('*')
    .eq('user_id', user.id)
    .is('session_id', null) // Lifetime records have null session_id
    .in('topic_name', uniqueTopicNames)
    .order('mastery_score', { ascending: false })
  
  console.log('✅ Topic mastery data fetched:', topicMasteryData?.length || 0, 'topics')

  // Generate dynamic recommendations based on practice history and current performance
  const dynamicRecommendations: Array<{
    title: string
    description: string
    type: 'practice' | 'review' | 'improve' | 'maintain'
    priority: number
    topic?: string
    difficulty?: string
  }> = []

  // Use progress summary if available (much faster!)
  if (progressSummary) {
    console.log('Using progress summary for recommendations')
    
    // Weak topics from pre-calculated summary
    const weakTopicsData = progressSummary.weak_topics as any[]
    if (weakTopicsData && weakTopicsData.length > 0) {
      weakTopicsData.slice(0, 2).forEach((topicData: any) => {
        dynamicRecommendations.push({
          title: `Practice ${topicData.topic}`,
          description: `Your accuracy in ${topicData.topic} is ${topicData.accuracy.toFixed(0)}% (${topicData.correct}/${topicData.attempts}). Daily practice will help improve this area.`,
          type: 'practice',
          priority: topicData.priority || 1,
          topic: topicData.topic
        })
      })
    }

    // Improving topics from summary
    const improvingTopicsData = progressSummary.improving_topics as any[]
    if (improvingTopicsData && improvingTopicsData.length > 0) {
      improvingTopicsData.slice(0, 1).forEach((topicData: any) => {
        dynamicRecommendations.push({
          title: `Keep Improving ${topicData.topic}`,
          description: `You're making progress in ${topicData.topic} (${topicData.accuracy.toFixed(0)}% accuracy). A few more practice sessions will solidify your understanding.`,
          type: 'improve',
          priority: 2,
          topic: topicData.topic
        })
      })
    }

    // Strong topics from summary
    const strongTopicsData = progressSummary.strong_topics as any[]
    if (strongTopicsData && strongTopicsData.length > 0) {
      strongTopicsData.slice(0, 1).forEach((topicData: any) => {
        dynamicRecommendations.push({
          title: `Maintain Excellence in ${topicData.topic}`,
          description: `Great work! You have ${topicData.accuracy.toFixed(0)}% accuracy in ${topicData.topic}. Review periodically to maintain this level.`,
          type: 'maintain',
          priority: 3,
          topic: topicData.topic
        })
      })
    }
  } else if (historicalMetrics && historicalMetrics.length > 0) {
    // Fallback: Analyze historical performance manually
    console.log('Using historical metrics for recommendations (slower)')
    const topicPerformance = new Map<string, { correct: number; total: number }>()
    
    historicalMetrics.forEach((metric: any) => {
      const topic = metric.question?.question_topic
      if (topic) {
        const current = topicPerformance.get(topic) || { correct: 0, total: 0 }
        current.total += 1
        if (metric.is_correct === true || metric.is_correct === 1) {
          current.correct += 1
        }
        topicPerformance.set(topic, current)
      }
    })

    // Find consistently weak topics (accuracy < 60% with at least 3 attempts)
    const weakTopics = Array.from(topicPerformance.entries())
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.6)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .slice(0, 2)

    weakTopics.forEach(([topic, stats]) => {
      const accuracy = ((stats.correct / stats.total) * 100).toFixed(0)
      dynamicRecommendations.push({
        title: `Practice ${topic}`,
        description: `Your accuracy in ${topic} is ${accuracy}% (${stats.correct}/${stats.total}). Daily practice will help improve this area.`,
        type: 'practice',
        priority: 1,
        topic
      })
    })

    // Find improving topics (accuracy 60-80% with at least 3 attempts)
    const improvingTopics = Array.from(topicPerformance.entries())
      .filter(([_, stats]) => {
        const acc = stats.correct / stats.total
        return stats.total >= 3 && acc >= 0.6 && acc < 0.8
      })
      .slice(0, 1)

    improvingTopics.forEach(([topic, stats]) => {
      const accuracy = ((stats.correct / stats.total) * 100).toFixed(0)
      dynamicRecommendations.push({
        title: `Keep Improving ${topic}`,
        description: `You're making progress in ${topic} (${accuracy}% accuracy). A few more practice sessions will solidify your understanding.`,
        type: 'improve',
        priority: 2,
        topic
      })
    })

    // Find strong topics (accuracy >= 80% with at least 3 attempts)
    const strongTopics = Array.from(topicPerformance.entries())
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) >= 0.8)
      .slice(0, 1)

    strongTopics.forEach(([topic, stats]) => {
      const accuracy = ((stats.correct / stats.total) * 100).toFixed(0)
      dynamicRecommendations.push({
        title: `Maintain Excellence in ${topic}`,
        description: `Great work! You have ${accuracy}% accuracy in ${topic}. Review periodically to maintain this level.`,
        type: 'maintain',
        priority: 3,
        topic
      })
    })
  }

  // Analyze practice frequency
  if (practiceHistory && practiceHistory.length > 0) {
    const daysSinceLastPractice = Math.floor(
      (new Date().getTime() - new Date(practiceHistory[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (practiceHistory.length < 3) {
      dynamicRecommendations.push({
        title: 'Build a Practice Streak',
        description: `You've completed ${practiceHistory.length} session${practiceHistory.length > 1 ? 's' : ''} this month. Try to practice at least 3 times per week for better retention.`,
        type: 'practice',
        priority: 2
      })
    }

    // Check for difficulty progression
    const currentSessionAccuracy = session.total_questions > 0 
      ? (session.correct_answers / session.total_questions) * 100 
      : 0

    const hardQuestionsAttempted = sessionSummary?.hard_total || 0

    if (currentSessionAccuracy >= 80 && hardQuestionsAttempted === 0) {
      dynamicRecommendations.push({
        title: 'Challenge Yourself with Hard Questions',
        description: `You scored ${currentSessionAccuracy.toFixed(0)}% in this session. You're ready to tackle harder questions to accelerate your learning.`,
        type: 'improve',
        priority: 1,
        difficulty: 'hard'
      })
    }
  }

  // Fallback recommendations if no historical data
  if (dynamicRecommendations.length === 0) {
    if (weakAreas.length > 0) {
      weakAreas.slice(0, 2).forEach(area => {
        dynamicRecommendations.push({
          title: `Focus on ${area.topic}`,
          description: `Your accuracy in ${area.topic} is ${area.accuracy.toFixed(0)}%. Targeted practice will help you improve quickly.`,
          type: 'practice',
          priority: 1,
          topic: area.topic
        })
      })
    }

    dynamicRecommendations.push({
      title: 'Practice Regularly',
      description: 'Consistent daily practice is key to mastering aptitude questions. Aim for at least 15-20 minutes per day.',
      type: 'practice',
      priority: 2
    })
  }

  // Sort by priority and limit to top 3
  const finalRecommendations = dynamicRecommendations
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)

  // Merge with AI recommendations if available
  const allRecommendations = [...finalRecommendations, ...recommendations].slice(0, 3)

  console.log('✅ Generated dynamic recommendations:', finalRecommendations.length)

  return (
    <PracticeSummary
      session={session}
      sessionStats={sessionStats}
      sessionSummary={sessionSummary || null}
      metrics={metrics || []}
      recommendations={allRecommendations}
      categoryId={categoryId}
      weakAreas={weakAreas.slice(0, 5)} // Top 5 weak areas
      strongAreas={strongAreas.slice(0, 5)} // Top 5 strong areas
      performanceAnalysis={performanceAnalysis}
      topicMasteryData={topicMasteryData || []}
      attemptedCount={finalAttemptedCount}
      notAttemptedCount={finalNotAttemptedCount}
      skippedCount={finalSkippedCount}
      incorrectCount={finalIncorrectCount}
      correctCount={finalCorrectCount}
      markedCount={finalMarkedCount}
      finalMastery={finalMastery}
      startingMastery={startingMastery}
      masteryChange={finalMastery - startingMastery}
    />
  )
}

