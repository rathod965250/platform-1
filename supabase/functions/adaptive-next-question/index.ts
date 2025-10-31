// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdaptiveRequest {
  user_id: string
  category_id: string
  session_id: string
  selected_subcategories: string[]
  answered_question_ids?: string[]
  last_question?: {
    question_id: string
    is_correct: boolean
    time_taken: number
    difficulty: string
  }
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

    const requestBody: AdaptiveRequest = await req.json()
    const {
      user_id,
      category_id,
      session_id,
      selected_subcategories,
      answered_question_ids = [],
      last_question,
    } = requestBody

    // Validate required fields
    if (!user_id || !category_id || !session_id || !selected_subcategories || selected_subcategories.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    let currentMastery = 0.50
    let previousDifficulty = 'medium'
    let currentDifficulty = 'medium'

    // Step 1: If last_question exists, process it and update state
    if (last_question) {
      // Fetch current adaptive state
      const { data: adaptiveState } = await supabaseClient
        .from('adaptive_state')
        .select('*')
        .eq('user_id', user_id)
        .eq('category_id', category_id)
        .single()

      if (adaptiveState) {
        currentMastery = parseFloat(adaptiveState.mastery_score)
        previousDifficulty = adaptiveState.current_difficulty
      } else {
        // Initialize adaptive state
        await supabaseClient
          .from('adaptive_state')
          .insert({
            user_id,
            category_id,
            mastery_score: 0.50,
            current_difficulty: 'medium',
          })
      }

      // Calculate new mastery score
      const masteryAdjustment = last_question.is_correct ? 0.05 : -0.05
      const newMastery = Math.max(0, Math.min(1, currentMastery + masteryAdjustment))

      // Determine next difficulty based on mastery
      if (newMastery > 0.75) {
        currentDifficulty = 'hard'
      } else if (newMastery < 0.35) {
        currentDifficulty = 'easy'
      } else {
        currentDifficulty = 'medium'
      }

      // Fetch question details for subcategory
      const { data: questionData } = await supabaseClient
        .from('questions')
        .select('subcategory_id')
        .eq('id', last_question.question_id)
        .single()

      // Update adaptive state using the helper function
      await supabaseClient.rpc('update_adaptive_state', {
        p_user_id: user_id,
        p_category_id: category_id,
        p_is_correct: last_question.is_correct,
        p_time_taken: last_question.time_taken,
        p_new_difficulty: currentDifficulty,
      })

      // Log to user_metrics
      await supabaseClient.from('user_metrics').insert({
        user_id,
        session_id,
        question_id: last_question.question_id,
        subcategory_id: questionData?.subcategory_id,
        is_correct: last_question.is_correct,
        time_taken_seconds: last_question.time_taken,
        difficulty: last_question.difficulty,
        previous_difficulty: previousDifficulty,
        mastery_score_before: currentMastery,
        mastery_score_after: newMastery,
      })

      currentMastery = newMastery
    } else {
      // First question - check if adaptive state exists
      const { data: adaptiveState } = await supabaseClient
        .from('adaptive_state')
        .select('*')
        .eq('user_id', user_id)
        .eq('category_id', category_id)
        .single()

      if (adaptiveState) {
        currentMastery = parseFloat(adaptiveState.mastery_score)
        currentDifficulty = adaptiveState.current_difficulty
      } else {
        // Initialize
        await supabaseClient
          .from('adaptive_state')
          .insert({
            user_id,
            category_id,
            mastery_score: 0.50,
            current_difficulty: 'medium',
          })
      }
    }

    // Step 2: Fetch next question
    // CRITICAL: Only fetch from selected subcategories and exclude answered questions
    let nextQuestion = null
    const difficulties = [currentDifficulty, 'medium', 'easy', 'hard'] // Fallback order

    for (const difficulty of difficulties) {
      let query = supabaseClient
        .from('questions')
        .select(`
          id,
          question_text,
          question_type,
          options,
          correct_answer,
          explanation,
          marks,
          difficulty,
          subcategory:subcategories(
            id,
            name,
            category:categories(name)
          )
        `)
        .in('subcategory_id', selected_subcategories)
        .eq('difficulty', difficulty)
        .limit(50)

      const { data: questions, error } = await query

      // Filter out answered questions client-side if needed
      let filteredQuestions = questions || []
      if (answered_question_ids.length > 0) {
        filteredQuestions = filteredQuestions.filter((q: any) => !answered_question_ids.includes(q.id))
      }

      if (error) {
        console.error('Error fetching questions:', error)
        continue
      }

      if (filteredQuestions && filteredQuestions.length > 0) {
        // Pick random question from results
        nextQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)]
        break
      }
    }

    if (!nextQuestion) {
      return new Response(
        JSON.stringify({
          error: 'No more questions available for selected topics',
          exhausted: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Step 3: Count total questions answered in this session
    const { count: questionsAnswered } = await supabaseClient
      .from('user_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)

    // Step 4: Calculate recent accuracy
    const { data: recentMetrics } = await supabaseClient
      .from('user_metrics')
      .select('is_correct')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(5)

    const recentAccuracy = recentMetrics && recentMetrics.length > 0
      ? (recentMetrics.filter((m: any) => m.is_correct).length / recentMetrics.length) * 100
      : 0

    // Return response
    return new Response(
      JSON.stringify({
        question: {
          id: nextQuestion.id,
          text: nextQuestion.question_text,
          type: nextQuestion.question_type,
          options: nextQuestion.options,
          difficulty: nextQuestion.difficulty,
          subcategory: nextQuestion.subcategory,
        },
        analytics: {
          mastery_score: currentMastery,
          current_difficulty: currentDifficulty,
          recent_accuracy: Math.round(recentAccuracy),
          questions_answered: (questionsAnswered || 0) + (last_question ? 1 : 0),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in adaptive-next-question:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

