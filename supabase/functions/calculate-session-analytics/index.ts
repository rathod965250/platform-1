// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionAnalyticsRequest {
  session_id: string
  user_id: string
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

    const { session_id, user_id }: SessionAnalyticsRequest = await req.json()

    if (!session_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or user_id' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Fetch the practice session
    const { data: session } = await supabaseClient
      .from('practice_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Fetch all user_metrics for this session
    const { data: metrics } = await supabaseClient
      .from('user_metrics')
      .select(`
        *,
        subcategory:subcategories(id, name)
      `)
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (!metrics || metrics.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No metrics found for session' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Calculate average accuracy
    const totalQuestions = metrics.length
    const correctQuestions = metrics.filter((m: any) => m.is_correct).length
    const avgAccuracy = (correctQuestions / totalQuestions) * 100

    // Calculate average time
    const totalTime = metrics.reduce((sum: number, m: any) => sum + m.time_taken_seconds, 0)
    const avgTime = Math.round(totalTime / totalQuestions)

    // Calculate improvement rate (first 5 vs last 5 questions)
    const firstFive = metrics.slice(0, Math.min(5, totalQuestions))
    const lastFive = metrics.slice(Math.max(0, totalQuestions - 5))

    const firstFiveAccuracy = firstFive.length > 0
      ? (firstFive.filter((m: any) => m.is_correct).length / firstFive.length) * 100
      : 0

    const lastFiveAccuracy = lastFive.length > 0
      ? (lastFive.filter((m: any) => m.is_correct).length / lastFive.length) * 100
      : 0

    const improvementRate = lastFiveAccuracy - firstFiveAccuracy

    // Count difficulty transitions
    let difficultyTransitions = 0
    for (let i = 1; i < metrics.length; i++) {
      if (metrics[i].difficulty !== metrics[i - 1].difficulty) {
        difficultyTransitions++
      }
    }

    // Calculate topic-wise accuracy
    const topicStats: Record<string, { correct: number; total: number }> = {}

    metrics.forEach((m: any) => {
      if (m.subcategory && m.subcategory.name) {
        const topicName = m.subcategory.name
        if (!topicStats[topicName]) {
          topicStats[topicName] = { correct: 0, total: 0 }
        }
        topicStats[topicName].total += 1
        if (m.is_correct) {
          topicStats[topicName].correct += 1
        }
      }
    })

    const topicWiseAccuracy: Record<string, number> = {}
    Object.entries(topicStats).forEach(([topic, stats]) => {
      topicWiseAccuracy[topic] = (stats.correct / stats.total) * 100
    })

    // Calculate session duration (time from first to last question)
    const sessionStart = new Date(metrics[0].created_at).getTime()
    const sessionEnd = new Date(metrics[metrics.length - 1].created_at).getTime()
    const sessionDuration = Math.round((sessionEnd - sessionStart) / 1000) + metrics[metrics.length - 1].time_taken_seconds

    // Insert into session_stats
    const { error: insertError } = await supabaseClient
      .from('session_stats')
      .insert({
        session_id,
        user_id,
        category_id: session.category_id,
        avg_accuracy: avgAccuracy,
        avg_time_seconds: avgTime,
        difficulty_transitions: difficultyTransitions,
        session_duration_seconds: sessionDuration,
        improvement_rate: improvementRate,
        topic_wise_accuracy: topicWiseAccuracy,
      })

    if (insertError) {
      console.error('Error inserting session stats:', insertError)
      // Don't fail if stats already exist
      if (insertError.code !== '23505') { // unique violation
        throw insertError
      }
    }

    // Generate recommendations
    const recommendations: string[] = []

    // Weak topics (accuracy < 60%)
    const weakTopics = Object.entries(topicWiseAccuracy)
      .filter(([_, acc]) => acc < 60)
      .map(([topic]) => topic)

    if (weakTopics.length > 0) {
      recommendations.push(`Focus on improving: ${weakTopics.join(', ')}`)
    }

    // Improvement trend
    if (improvementRate > 10) {
      recommendations.push(`Great progress! You improved ${improvementRate.toFixed(1)}% during this session`)
    } else if (improvementRate < -10) {
      recommendations.push('Take a break and come back refreshed. Consistency is key!')
    }

    // Time management
    if (avgTime > 120) {
      recommendations.push('Try to work on time management. Aim for under 2 minutes per question')
    } else if (avgTime < 30) {
      recommendations.push('You\'re answering quickly! Make sure to read questions carefully')
    }

    // Accuracy-based
    if (avgAccuracy >= 80) {
      recommendations.push('Excellent work! Consider trying harder difficulty questions')
    } else if (avgAccuracy < 50) {
      recommendations.push('Review the basics and practice more easy questions to build confidence')
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          avg_accuracy: avgAccuracy,
          avg_time_seconds: avgTime,
          improvement_rate: improvementRate,
          difficulty_transitions: difficultyTransitions,
          session_duration_seconds: sessionDuration,
          topic_wise_accuracy: topicWiseAccuracy,
          total_questions: totalQuestions,
          correct_questions: correctQuestions,
        },
        recommendations,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in calculate-session-analytics:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'An unexpected error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

