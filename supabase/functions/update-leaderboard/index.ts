// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeaderboardRequest {
  attempt_id: string
  user_id: string
  test_id: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { attempt_id, user_id, test_id }: LeaderboardRequest = await req.json()

    if (!attempt_id || !user_id || !test_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Fetch the test attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('test_attempts')
      .select('*')
      .eq('id', attempt_id)
      .single()

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Test attempt not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Fetch all attempts for this test to calculate rank and percentile
    const { data: allAttempts, error: allAttemptsError } = await supabaseClient
      .from('test_attempts')
      .select('id, user_id, score, time_taken_seconds')
      .eq('test_id', test_id)
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })

    if (allAttemptsError || !allAttempts) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch test attempts' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Calculate rank (1-indexed)
    const rank = allAttempts.findIndex((a: any) => a.id === attempt_id) + 1
    
    // Calculate percentile
    // Percentile = (Number of scores below this score / Total number of scores) × 100
    const totalAttempts = allAttempts.length
    const scoresBelow = allAttempts.filter((a: any) => 
      a.score < attempt.score || 
      (a.score === attempt.score && a.time_taken_seconds > attempt.time_taken_seconds)
    ).length
    const percentile = totalAttempts > 1 ? (scoresBelow / (totalAttempts - 1)) * 100 : 100

    // Update test_attempts with rank and percentile
    const { error: updateAttemptError } = await supabaseClient
      .from('test_attempts')
      .update({
        rank: rank,
        percentile: percentile.toFixed(2),
      })
      .eq('id', attempt_id)

    if (updateAttemptError) {
      console.error('Error updating test attempt:', updateAttemptError)
    }

    // Helper function to get start of week (Monday)
    const getStartOfWeek = (date: Date): Date => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      return new Date(d.setDate(diff))
    }

    // Helper function to get start of month
    const getStartOfMonth = (date: Date): Date => {
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }

    const now = new Date()
    const startOfWeek = getStartOfWeek(now)
    const startOfMonth = getStartOfMonth(now)

    // Calculate rankings for different period types
    const periodTypes = [
      { type: 'all', filter: null },
      { type: 'weekly', filter: startOfWeek },
      { type: 'monthly', filter: startOfMonth },
    ]

    for (const period of periodTypes) {
      // Fetch attempts for this period
      let query = supabaseClient
        .from('test_attempts')
        .select('id, user_id, score, time_taken_seconds')
        .eq('test_id', test_id)

      if (period.filter) {
        query = query.gte('submitted_at', period.filter.toISOString())
      }

      const { data: periodAttempts } = await query
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })

      if (!periodAttempts || periodAttempts.length === 0) continue

      // Calculate rank for this period
      const periodRank = periodAttempts.findIndex((a: any) => a.id === attempt_id) + 1
      
      // If user's attempt is not in this period, skip
      if (periodRank === 0) continue

      // Calculate percentile for this period
      const periodTotal = periodAttempts.length
      const periodScoresBelow = periodAttempts.filter((a: any) => 
        a.score < attempt.score || 
        (a.score === attempt.score && a.time_taken_seconds > attempt.time_taken_seconds)
      ).length
      const periodPercentile = periodTotal > 1 ? (periodScoresBelow / (periodTotal - 1)) * 100 : 100

      // Upsert leaderboard entry
      const { error: leaderboardError } = await supabaseClient
        .from('leaderboard')
        .upsert({
          user_id: user_id,
          test_id: test_id,
          rank: periodRank,
          score: attempt.score,
          time_taken: attempt.time_taken_seconds,
          percentile: periodPercentile.toFixed(2),
          period_type: period.type,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,test_id,period_type',
        })

      if (leaderboardError) {
        console.error(`Error updating leaderboard for ${period.type}:`, leaderboardError)
      }
    }

    // Update user_analytics
    await updateUserAnalytics(supabaseClient, user_id, test_id, attempt)

    return new Response(
      JSON.stringify({
        success: true,
        rank: rank,
        percentile: percentile.toFixed(2),
        total_attempts: totalAttempts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in update-leaderboard:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'An unexpected error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to update user_analytics
async function updateUserAnalytics(supabaseClient: any, userId: string, testId: string, attempt: any) {
  try {
    // Fetch test to get category_id
    const { data: test } = await supabaseClient
      .from('tests')
      .select('category_id')
      .eq('id', testId)
      .single()

    if (!test) return

    // Fetch current analytics
    const { data: analytics } = await supabaseClient
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', test.category_id)
      .single()

    // Fetch all test attempts for this user and category
    const { data: userTests } = await supabaseClient
      .from('test_attempts')
      .select(`
        score,
        time_taken_seconds,
        test:tests!inner(category_id)
      `)
      .eq('user_id', userId)
      .eq('test.category_id', test.category_id)

    if (!userTests || userTests.length === 0) return

    // Calculate average score
    const totalScore = userTests.reduce((sum: number, t: any) => sum + t.score, 0)
    const avgScore = totalScore / userTests.length

    // Calculate total time spent
    const totalTime = userTests.reduce((sum: number, t: any) => sum + t.time_taken_seconds, 0)

    // Fetch practice sessions for this category
    const { data: practiceSessions } = await supabaseClient
      .from('practice_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', test.category_id)

    const totalPracticeSessions = practiceSessions?.length || 0

    // Calculate weak areas and strengths from attempt_answers
    const { data: attemptAnswers } = await supabaseClient
      .from('attempt_answers')
      .select(`
        is_correct,
        question:questions!inner(
          subcategory:subcategories(name)
        )
      `)
      .in('attempt_id', userTests.map((t: any) => t.id))

    const topicStats: Record<string, { correct: number; total: number }> = {}
    
    if (attemptAnswers) {
      attemptAnswers.forEach((answer: any) => {
        const topicName = answer.question?.subcategory?.name
        if (topicName) {
          if (!topicStats[topicName]) {
            topicStats[topicName] = { correct: 0, total: 0 }
          }
          topicStats[topicName].total += 1
          if (answer.is_correct) {
            topicStats[topicName].correct += 1
          }
        }
      })
    }

    // Identify weak areas (< 60% accuracy)
    const weakAreas: Record<string, number> = {}
    const strengths: Record<string, number> = {}
    
    Object.entries(topicStats).forEach(([topic, stats]) => {
      const accuracy = (stats.correct / stats.total) * 100
      if (accuracy < 60) {
        weakAreas[topic] = accuracy
      } else if (accuracy >= 75) {
        strengths[topic] = accuracy
      }
    })

    // Calculate streak
    const { data: recentActivity } = await supabaseClient
      .from('test_attempts')
      .select('submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(30)

    let currentStreak = 0
    if (recentActivity && recentActivity.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let checkDate = new Date(today)
      const activityDates = new Set(
        recentActivity.map((a: any) => {
          const d = new Date(a.submitted_at)
          d.setHours(0, 0, 0, 0)
          return d.getTime()
        })
      )

      while (activityDates.has(checkDate.getTime())) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    // Upsert user_analytics
    const { error: analyticsError } = await supabaseClient
      .from('user_analytics')
      .upsert({
        user_id: userId,
        category_id: test.category_id,
        total_attempts: userTests.length,
        total_practice_sessions: totalPracticeSessions,
        avg_score: avgScore.toFixed(2),
        total_time_spent_seconds: totalTime,
        weak_areas: weakAreas,
        strengths: strengths,
        current_streak_days: currentStreak,
        last_activity_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,category_id',
      })

    if (analyticsError) {
      console.error('Error updating user analytics:', analyticsError)
    }
  } catch (error) {
    console.error('Error in updateUserAnalytics:', error)
  }
}
