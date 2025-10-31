// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendationsRequest {
  user_id: string
  category_id?: string
}

interface Recommendation {
  type: 'practice' | 'time_management' | 'consistency' | 'difficulty'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  action_url: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { user_id, category_id }: RecommendationsRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Fetch adaptive states
    let adaptiveStatesQuery = supabaseClient
      .from('adaptive_state')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq('user_id', user_id)

    if (category_id) {
      adaptiveStatesQuery = adaptiveStatesQuery.eq('category_id', category_id)
    }

    const { data: adaptiveStates } = await adaptiveStatesQuery

    // Fetch recent session stats (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    let sessionStatsQuery = supabaseClient
      .from('session_stats')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq('user_id', user_id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })

    if (category_id) {
      sessionStatsQuery = sessionStatsQuery.eq('category_id', category_id)
    }

    const { data: sessionStats } = await sessionStatsQuery

    // Analyze data and generate recommendations
    const recommendations: Recommendation[] = []
    const strengths: string[] = []
    const weaknesses: string[] = []
    const masteryLevels: Record<string, number> = {}

    // Process adaptive states
    if (adaptiveStates && adaptiveStates.length > 0) {
      adaptiveStates.forEach((state: any) => {
        const categoryName = state.category?.name || 'Unknown'
        const mastery = parseFloat(state.mastery_score)
        masteryLevels[categoryName] = mastery

        if (mastery >= 0.8) {
          strengths.push(categoryName)
        } else if (mastery < 0.4) {
          weaknesses.push(categoryName)
        }
      })
    }

    // Process session stats for topic-level insights
    const allTopicAccuracies: Record<string, { total: number; sum: number }> = {}

    if (sessionStats && sessionStats.length > 0) {
      sessionStats.forEach((stat: any) => {
        if (stat.topic_wise_accuracy) {
          Object.entries(stat.topic_wise_accuracy).forEach(([topic, accuracy]) => {
            if (!allTopicAccuracies[topic]) {
              allTopicAccuracies[topic] = { total: 0, sum: 0 }
            }
            allTopicAccuracies[topic].total += 1
            allTopicAccuracies[topic].sum += Number(accuracy)
          })
        }
      })

      // Calculate average accuracy per topic
      const topicAverages: Record<string, number> = {}
      Object.entries(allTopicAccuracies).forEach(([topic, data]) => {
        topicAverages[topic] = data.sum / data.total
      })

      // Identify weak topics
      const weakTopics = Object.entries(topicAverages)
        .filter(([_, acc]) => acc < 60)
        .map(([topic]) => topic)

      const strongTopics = Object.entries(topicAverages)
        .filter(([_, acc]) => acc > 80)
        .map(([topic]) => topic)

      // Generate recommendations based on weak topics
      weakTopics.slice(0, 2).forEach((topic) => {
        recommendations.push({
          type: 'practice',
          title: `Practice ${topic}`,
          description: `Your accuracy in ${topic} is below 60%. Daily practice will help improve this area.`,
          priority: 'high',
          action_url: '/practice',
        })
      })

      // Encourage strong topics
      if (strongTopics.length > 0 && recommendations.length < 3) {
        recommendations.push({
          type: 'difficulty',
          title: `Challenge Yourself in ${strongTopics[0]}`,
          description: `You're excelling at ${strongTopics[0]}! Try harder difficulty questions to push your limits.`,
          priority: 'medium',
          action_url: '/practice',
        })
      }

      // Calculate practice frequency
      const practiceFrequency = sessionStats.length
      if (practiceFrequency < 3) {
        recommendations.push({
          type: 'consistency',
          title: 'Build a Practice Habit',
          description: 'Try to practice at least 3 times per week for better retention and improvement.',
          priority: 'high',
          action_url: '/dashboard',
        })
      }

      // Analyze time management
      const avgSessionTime = sessionStats.reduce((sum: number, s: any) => sum + (s.avg_time_seconds || 0), 0) / sessionStats.length
      if (avgSessionTime > 90) {
        recommendations.push({
          type: 'time_management',
          title: 'Improve Time Management',
          description: 'You\'re averaging over 90 seconds per question. Practice answering more quickly while maintaining accuracy.',
          priority: 'medium',
          action_url: '/practice',
        })
      }
    }

    // Add default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'practice',
        title: 'Start Your Practice Journey',
        description: 'Begin with adaptive practice to build your confidence and identify your strengths.',
        priority: 'high',
        action_url: '/practice',
      })
    }

    // Limit to 5 recommendations
    const finalRecommendations = recommendations.slice(0, 5)

    return new Response(
      JSON.stringify({
        recommendations: finalRecommendations,
        strengths: strengths.length > 0 ? strengths : ['Keep practicing to identify your strengths'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified yet'],
        mastery_levels: masteryLevels,
        total_sessions: sessionStats?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in generate-ai-recommendations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

