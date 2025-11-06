// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to construct options object from individual option columns
// Column names with spaces: "option a", "option b", etc.
function constructOptions(question: any): any {
  if (question.options) {
    // If options already exists (backward compatibility), return it
    return question.options
  }
  
  // Construct options from individual columns (with spaces in column names)
  const optionsArray: string[] = []
  if (question['option a']) optionsArray.push(question['option a'])
  if (question['option b']) optionsArray.push(question['option b'])
  if (question['option c']) optionsArray.push(question['option c'])
  if (question['option d']) optionsArray.push(question['option d'])
  if (question['option e']) optionsArray.push(question['option e'])
  
  // Return in the format expected by the frontend
  return { options: optionsArray }
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

  console.log('=== EDGE FUNCTION STARTED ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Timestamp:', new Date().toISOString())

  try {
    // Get Authorization header
    const authHeader = req.headers.get('Authorization')
    
    // Create client with user's auth token for RLS checks
    // The Authorization header sets the auth context for RLS policies
    // @ts-ignore
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
        auth: {
          persistSession: false,
        },
      }
    )

    console.log('Supabase client created')
    console.log('Auth header present:', !!authHeader)
    console.log('Auth header value:', authHeader?.substring(0, 30) + '...')
    
    // Verify auth context is set by checking auth.uid()
    // This helps debug RLS policy issues
    if (authHeader) {
      const { data: { user: testUser } } = await supabaseClient.auth.getUser()
      console.log('Auth context verified - User ID:', testUser?.id)
      if (!testUser) {
        console.error('WARNING: Authorization header present but auth context not set!')
        console.error('This will cause RLS policies to fail')
      }
    }

    const requestBody: AdaptiveRequest = await req.json()
    console.log('Request body parsed successfully')
    
    const {
      user_id,
      category_id,
      session_id,
      selected_subcategories,
      answered_question_ids = [],
      last_question,
    } = requestBody

    console.log('Request parameters extracted:')
    console.log('- User ID:', user_id)
    console.log('- Category ID:', category_id)
    console.log('- Session ID:', session_id)
    console.log('- Selected subcategories:', selected_subcategories)
    console.log('- Answered question IDs count:', answered_question_ids.length)

    // Validate required fields
    if (!user_id || !category_id || !session_id || !selected_subcategories || selected_subcategories.length === 0) {
      console.error('Validation failed: Missing required fields')
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          debug: {
            has_user_id: !!user_id,
            has_category_id: !!category_id,
            has_session_id: !!session_id,
            has_selected_subcategories: !!selected_subcategories,
            selected_subcategories_count: selected_subcategories?.length || 0,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Verify authentication and RLS policy
    console.log('=== Authentication & RLS Verification ===')
    console.log('User ID:', user_id)
    console.log('Auth header present:', !!req.headers.get('Authorization'))
    
    // Verify user authentication by checking the auth context
    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !authUser) {
      console.error('Authentication verification FAILED!')
      console.error('Auth error:', authError)
      console.error('This may indicate the Authorization header is not properly set')
      
      // Return error if authentication fails
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          exhausted: false,
          debug: {
            auth_error: authError?.message || 'No user found',
            has_auth_header: !!req.headers.get('Authorization'),
            user_id_from_request: user_id,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }
    
    console.log('Authentication verified - User ID:', authUser.id)
    console.log('Auth user matches request user:', authUser.id === user_id)
    
    // Test RLS policy by querying a single question
    console.log('Testing RLS policy - querying questions table...')
    const { data: rlsTest, error: rlsError, count: rlsCount } = await supabaseClient
      .from('questions')
      .select('id', { count: 'exact' })
      .limit(1)
      .single()
    
    if (rlsError) {
      console.error('RLS Policy Test FAILED!')
      console.error('RLS Error code:', rlsError.code)
      console.error('RLS Error message:', rlsError.message)
      console.error('RLS Error details:', JSON.stringify(rlsError))
      console.error('This may indicate RLS policy is blocking access')
      console.error('Auth user ID:', authUser.id)
      console.error('Auth header:', req.headers.get('Authorization')?.substring(0, 20) + '...')
    } else {
      console.log('RLS Policy Test PASSED - can access questions')
      console.log('Sample question ID:', rlsTest?.id)
      console.log('Total questions count (from RLS test):', rlsCount || 'N/A')
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

    // Step 2: Check which topics have questions first
    // Validate subcategory IDs are valid UUIDs
    const validUUIDs = selected_subcategories.filter((id: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(id)
    })

    console.log('=== Question Availability Check ===')
    console.log('User ID:', user_id)
    console.log('Session ID:', session_id)
    console.log('Category ID:', category_id)
    console.log('Selected subcategories (count):', selected_subcategories.length)
    console.log('Valid UUIDs (count):', validUUIDs.length)
    console.log('Selected subcategories:', selected_subcategories)

    // First, verify we can query questions at all (RLS test)
    // Use the count from the RLS test we already did above
    let totalQuestionsCount = rlsCount || 0
    let allQuestionsError = rlsError
    
    // If we got a count from the RLS test, use it. Otherwise, try a broader query
    if (!rlsError && rlsCount === undefined) {
      console.log('RLS test did not return count, trying broader query...')
      const { data: allQuestionsTest, error: allQuestionsError2, count: totalQuestionsCount2 } = await supabaseClient
        .from('questions')
        .select('id, subcategory_id', { count: 'exact' })
        .limit(10)

      if (allQuestionsError2) {
        console.error('CRITICAL: Cannot query questions at all! RLS policy may be blocking.')
        console.error('RLS Error:', JSON.stringify(allQuestionsError2))
        allQuestionsError = allQuestionsError2
      } else {
        totalQuestionsCount = totalQuestionsCount2 || 0
        console.log(`RLS Test Passed: Can access questions. Found ${totalQuestionsCount} total questions in database`)
        console.log('Sample questions:', allQuestionsTest?.slice(0, 3).map((q: any) => ({
          id: q.id,
          subcategory_id: q.subcategory_id
        })))
      }
    } else {
      console.log(`Using RLS test count: ${totalQuestionsCount} total questions in database`)
    }

    // Query all questions for selected subcategories (RLS will filter based on policy)
    // The RLS policy allows: authenticated users can view all questions
    let allAvailableQuestions: any[] = []
    let checkError: any = null
    let topicsWithQuestions = new Set<string>()

    // Try querying by subcategory_id first
    if (validUUIDs.length > 0) {
      console.log('=== INITIAL AVAILABILITY CHECK ===')
      console.log('Attempting query by subcategory_id with filter...')
      console.log('Querying for subcategory IDs:', validUUIDs)
      console.log('Number of UUIDs to query:', validUUIDs.length)
      
      const { data, error, count } = await supabaseClient
        .from('questions')
        .select('subcategory_id', { count: 'exact' })
        .in('subcategory_id', validUUIDs)

      if (error) {
        console.error('ERROR: Query failed!')
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', JSON.stringify(error))
        checkError = error
      } else {
        allAvailableQuestions = data || []
        const totalCount = count || 0
        console.log(`SUCCESS: Found ${allAvailableQuestions.length} questions in data array`)
        console.log(`SUCCESS: Total count from query: ${totalCount}`)
        
        if (totalCount > 0 && allAvailableQuestions.length === 0) {
          console.warn('WARNING: Count shows questions exist but data array is empty!')
          console.warn('This might indicate a pagination or RLS issue.')
        }
        
        // Count questions per subcategory
        const questionCounts: Record<string, number> = {}
        allAvailableQuestions.forEach((q: any) => {
          if (q.subcategory_id) {
            topicsWithQuestions.add(q.subcategory_id)
            questionCounts[q.subcategory_id] = (questionCounts[q.subcategory_id] || 0) + 1
          }
        })
        console.log('Questions per subcategory:', questionCounts)
        console.log('Unique subcategories with questions:', Array.from(topicsWithQuestions))
        console.log(`Total unique subcategories with questions: ${topicsWithQuestions.size}`)
      }
    } else {
      console.warn('WARNING: No valid UUIDs to query!')
      console.warn('Selected subcategories:', selected_subcategories)
      console.warn('Valid UUIDs:', validUUIDs)
    }

    // If no questions found, try querying without filter to see what subcategories exist
    if (topicsWithQuestions.size === 0 && validUUIDs.length > 0) {
      console.log('No questions found with filter. Checking what subcategories have questions...')
      const { data: allSubcategories, error: subcatError } = await supabaseClient
        .from('questions')
        .select('subcategory_id')
        .limit(100)

      if (!subcatError && allSubcategories) {
        const availableSubcategories = new Set(allSubcategories.map((q: any) => q.subcategory_id).filter(Boolean))
        console.log(`Found ${availableSubcategories.size} unique subcategories with questions in database`)
        console.log('Available subcategory IDs:', Array.from(availableSubcategories).slice(0, 10))
        console.log('Requested subcategory IDs:', validUUIDs)
        
        // Check if any requested IDs match available IDs
        const matchingIds = validUUIDs.filter((id: string) => availableSubcategories.has(id))
        console.log(`Matching IDs: ${matchingIds.length} out of ${validUUIDs.length}`)
        
        if (matchingIds.length === 0) {
          console.error('NO MATCHING SUBCATEGORY IDs FOUND!')
          console.error('This suggests the selected subcategories do not have questions, or IDs do not match.')
        }
      }
    }

    // If no questions found by subcategory_id, try fallback to subcategory_slug
    if (topicsWithQuestions.size === 0 && selected_subcategories.length > 0) {
      console.log('No questions found by subcategory_id, trying fallback to subcategory_slug...')
      
      // Fetch subcategory slugs for the selected IDs
      const { data: subcategoriesData, error: subcatError } = await supabaseClient
        .from('subcategories')
        .select('id, slug')
        .in('id', selected_subcategories)

      if (subcatError) {
        console.error('Error fetching subcategories:', subcatError)
      } else if (subcategoriesData && subcategoriesData.length > 0) {
        const slugs = subcategoriesData.map((s: any) => s.slug)
        console.log('Found subcategory slugs:', slugs)

        // Try querying by subcategory_slug
        // First get subcategory IDs from slugs, then query questions
        const { data: subcatIdsBySlug, error: subcatSlugError } = await supabaseClient
          .from('subcategories')
          .select('id')
          .in('slug', slugs)
        
        if (subcatSlugError) {
          console.error('Error fetching subcategory IDs by slug:', subcatSlugError)
        } else if (subcatIdsBySlug && subcatIdsBySlug.length > 0) {
          const subcatIds = subcatIdsBySlug.map((s: any) => s.id)
          console.log('Found subcategory IDs from slugs:', subcatIds)
          
          // Now query questions by subcategory_id (no relationship needed)
          const { data: questionsBySlug, error: slugError } = await supabaseClient
            .from('questions')
            .select('subcategory_id')
            .in('subcategory_id', subcatIds)

          if (slugError) {
            console.error('Error checking questions by subcategory_slug:', slugError)
            console.error('Slug error details:', JSON.stringify(slugError))
          } else if (questionsBySlug && questionsBySlug.length > 0) {
            console.log(`Found ${questionsBySlug.length} questions by subcategory_slug`)
            questionsBySlug.forEach((q: any) => {
              if (q.subcategory_id) {
                topicsWithQuestions.add(q.subcategory_id)
              }
            })
          }
        }
      }
    }

    // If still no topics have questions, try querying by category_id as last resort
    if (topicsWithQuestions.size === 0) {
      console.log('No questions found for selected subcategories. Trying category-level query...')
      
      // Get subcategories for this category
      const { data: categorySubcategories, error: catSubError } = await supabaseClient
        .from('subcategories')
        .select('id')
        .eq('category_id', category_id)

      if (!catSubError && categorySubcategories && categorySubcategories.length > 0) {
        const categorySubcategoryIds = categorySubcategories.map((s: any) => s.id)
        console.log(`Found ${categorySubcategoryIds.length} subcategories in category ${category_id}`)
        
        // Query questions for all subcategories in this category
        const { data: categoryQuestions, error: catQError, count: catQuestionCount } = await supabaseClient
          .from('questions')
          .select('subcategory_id', { count: 'exact' })
          .in('subcategory_id', categorySubcategoryIds)
          .limit(100)

        if (!catQError && categoryQuestions && categoryQuestions.length > 0) {
          console.log(`Found ${catQuestionCount || 0} questions in entire category`)
          console.log('Category questions sample:', categoryQuestions.slice(0, 5))
          
          // Use all subcategories in the category that have questions
          categoryQuestions.forEach((q: any) => {
            if (q.subcategory_id) {
              topicsWithQuestions.add(q.subcategory_id)
            }
          })
          
          console.log(`Found questions for ${topicsWithQuestions.size} subcategories in category`)
        } else {
          console.error('No questions found even at category level!')
          console.error('Category query error:', catQError)
        }
      }
    }

    // If still no topics have questions, return detailed error
    if (topicsWithQuestions.size === 0) {
      console.error('=== NO QUESTIONS FOUND ===')
      console.error('Selected subcategories:', selected_subcategories)
      console.error('Valid UUIDs:', validUUIDs)
      console.error('Questions found:', allAvailableQuestions.length)
      console.error('Check error:', checkError)
      console.error('Total questions in database (from RLS test):', totalQuestionsCount || 0)
      
      // Serialize error object properly
      const serializedError = checkError ? {
        message: checkError.message || String(checkError),
        code: checkError.code || undefined,
        details: checkError.details || undefined,
        hint: checkError.hint || undefined,
      } : null
      
      const debugInfo = {
        selected_subcategories: selected_subcategories || [],
        valid_uuids: validUUIDs || [],
        questions_found: allAvailableQuestions.length || 0,
        total_questions_in_db: totalQuestionsCount || 0,
        rls_test_passed: !allQuestionsError,
        error: serializedError,
        message: 'If total_questions_in_db > 0 but questions_found = 0, the RLS policy may be blocking access. Please apply migration 025_fix_questions_rls_for_practice.sql',
        timestamp: new Date().toISOString(),
      }
      
      console.log('Returning debug info:', JSON.stringify(debugInfo, null, 2))
      
      return new Response(
        JSON.stringify({
          error: 'No questions available for selected topics. Please verify the RLS policy migration (025_fix_questions_rls_for_practice.sql) has been applied.',
          exhausted: true,
          debug: debugInfo,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Found questions for ${topicsWithQuestions.size} out of ${selected_subcategories.length} subcategories`)
    console.log('Topics with questions:', Array.from(topicsWithQuestions))

    // Use only topics that have questions
    const validSubcategories = selected_subcategories.filter((id: string) => topicsWithQuestions.has(id))
    console.log('Valid subcategories to use:', validSubcategories)

    // Step 3: Fetch next question from valid subcategories
    // CRITICAL: Only fetch from subcategories that have questions and exclude answered questions
    console.log('=== Fetching Next Question ===')
    console.log('Current difficulty:', currentDifficulty)
    console.log('Valid subcategories:', validSubcategories)
    console.log('Answered question IDs (count):', answered_question_ids.length)
    
    let nextQuestion: any = null
    const difficulties = [currentDifficulty, 'medium', 'easy', 'hard'] // Fallback order

    // Fetch subcategory info once (to avoid relationship ambiguity)
    console.log('Fetching subcategory info separately to avoid relationship ambiguity...')
    const { data: subcatsInfo, error: subcatsInfoError } = await supabaseClient
      .from('subcategories')
      .select('id, name, category_id')
      .in('id', validSubcategories)
    
    // Fetch category names separately to avoid relationship ambiguity
    const categoryIds = subcatsInfo ? [...new Set(subcatsInfo.map((s: any) => s.category_id).filter(Boolean))] : []
    const categoryMap = new Map<string, string>()
    
    if (categoryIds.length > 0) {
      const { data: categoriesInfo } = await supabaseClient
        .from('categories')
        .select('id, name')
        .in('id', categoryIds)
      
      if (categoriesInfo) {
        categoriesInfo.forEach((c: any) => {
          categoryMap.set(c.id, c.name)
        })
      }
    }
    
    const subcatMap = new Map<string, any>()
    if (!subcatsInfoError && subcatsInfo) {
      subcatsInfo.forEach((s: any) => {
        subcatMap.set(s.id, {
          id: s.id,
          name: s.name,
          category: s.category_id ? { name: categoryMap.get(s.category_id) || category_id } : { name: category_id }
        })
      })
      console.log(`Fetched info for ${subcatMap.size} subcategories`)
    } else if (subcatsInfoError) {
      console.error('Error fetching subcategory info:', subcatsInfoError)
    }

    // Strategy: Fetch all questions without difficulty filter first (we know this works)
    // Then filter by difficulty client-side to avoid RLS issues with filtered queries
    console.log('=== Fetching all questions for selected subcategories ===')
    console.log(`Valid subcategories:`, validSubcategories)
    console.log(`Answered question IDs count:`, answered_question_ids.length)
    
    // Verify authentication before querying
    const { data: { user: verifyUser } } = await supabaseClient.auth.getUser()
    if (!verifyUser) {
      console.error('Authentication check failed')
      console.error('This indicates the auth context is not properly set')
    } else {
      console.log(`Auth verified - User ID: ${verifyUser.id}`)
    }
    
    // Fetch all questions for selected subcategories (without difficulty filter)
    // Try fetching with minimal fields first to verify RLS works, then fetch full details
    console.log(`Fetching all questions for subcategories (without difficulty filter)...`)
    
    // First, try fetching with minimal fields to verify the query works
    const { data: questionIdsCheck, error: idsError, count: allCount } = await supabaseClient
      .from('questions')
      .select('id', { count: 'exact' })
      .in('subcategory_id', validSubcategories)
      .limit(200)
    
    console.log(`Question IDs query completed`)
    console.log(`- Error:`, idsError ? JSON.stringify(idsError) : 'None')
    console.log(`- Count from query:`, allCount || 0)
    console.log(`- Question IDs array length:`, questionIdsCheck?.length || 0)
    
    if (idsError) {
      console.error('=== ERROR FETCHING QUESTION IDs ===')
      console.error('Error code:', idsError.code)
      console.error('Error message:', idsError.message)
      console.error('Error details:', JSON.stringify(idsError))
    }
    
    // If we got question IDs, fetch full details for them
    let allQuestions: any[] = []
    if (questionIdsCheck && questionIdsCheck.length > 0) {
      console.log(`Found ${questionIdsCheck.length} question IDs, fetching full details...`)
      
      // Fetch full details for the question IDs
      const questionIds = questionIdsCheck.map((q: any) => q.id)
      
      // Fetch in batches to avoid query size limits
      const batchSize = 50
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize)
        const { data: batchQuestions, error: batchError } = await supabaseClient
          .from('questions')
          .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id')
          .in('id', batch)
        
        if (batchError) {
          console.error(`Error fetching batch ${i / batchSize + 1}:`, batchError)
        } else if (batchQuestions) {
          allQuestions = allQuestions.concat(batchQuestions)
          console.log(`Fetched ${batchQuestions.length} questions from batch ${i / batchSize + 1}`)
        }
      }
      
      console.log(`Total questions fetched: ${allQuestions.length}`)
    } else {
      console.error('No question IDs found, cannot fetch full details')
    }
    
    // Filter out answered questions
    let availableQuestions = (allQuestions || []).filter((q: any) => !answered_question_ids.includes(q.id))
    console.log(`Available questions after filtering answered: ${availableQuestions.length}`)
    
    // Now try each difficulty, filtering client-side
    for (const difficulty of difficulties) {
      console.log(`=== Attempting to fetch questions for difficulty: ${difficulty} ===`)
      
      // Filter by difficulty client-side
      const questionsForDifficulty = availableQuestions.filter((q: any) => q.difficulty === difficulty)
      console.log(`Found ${questionsForDifficulty.length} questions for difficulty ${difficulty} (client-side filter)`)
      
      if (questionsForDifficulty.length > 0) {
        // Pick random question from results
        const randomIndex = Math.floor(Math.random() * questionsForDifficulty.length)
        const selectedQuestion = questionsForDifficulty[randomIndex]
        
        // Add subcategory info to the selected question
        nextQuestion = {
          ...selectedQuestion,
          subcategory: subcatMap.get(selectedQuestion.subcategory_id) || null
        }
        
        console.log(`Selected question ${randomIndex + 1} of ${questionsForDifficulty.length} available`)
        console.log('Question ID:', nextQuestion.id)
        console.log('Question text preview:', nextQuestion['question text']?.substring(0, 50) + '...')
        break
      } else {
        console.log(`No available questions for difficulty ${difficulty} after client-side filtering`)
      }
    }
    
    // If we still don't have a question, try the original approach as fallback
    if (!nextQuestion) {
      console.log('=== Client-side filtering failed, trying direct queries ===')
      
      for (const difficulty of difficulties) {
        console.log(`=== Attempting direct query for difficulty: ${difficulty} ===`)
        console.log(`Valid subcategories:`, validSubcategories)
        
        // Query questions WITHOUT relationship to avoid ambiguity
        // We'll add subcategory info manually
        // Use the authenticated client - RLS policy should allow access
        console.log(`Querying questions with fields: id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id`)
        let { data: questions, error, count: questionCount } = await supabaseClient
          .from('questions')
          .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id', { count: 'exact' })
          .in('subcategory_id', validSubcategories)
          .eq('difficulty', difficulty)
          .limit(100) // Increased limit for better question selection

        // Log query result regardless of success/failure
        console.log(`Query completed for difficulty ${difficulty}`)
        console.log(`- Error:`, error ? JSON.stringify(error) : 'None')
        console.log(`- Count from query:`, questionCount || 0)
        console.log(`- Questions array length:`, questions?.length || 0)
        console.log(`- Count vs Array discrepancy:`, (questionCount || 0) > 0 && (questions?.length || 0) === 0 ? 'YES - RLS ISSUE DETECTED' : 'No')

        if (error) {
        console.error(`=== ERROR FETCHING QUESTIONS FOR DIFFICULTY ${difficulty} ===`)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', JSON.stringify(error))
        console.error('Error hint:', error.hint)
        console.error('Query parameters:', {
          subcategory_ids: validSubcategories,
          difficulty,
          limit: 100,
        })
        console.error('Auth user ID:', verifyUser.id)
        console.error('Count from query:', questionCount)
        
        // If this is a permission error, log it clearly
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('=== RLS POLICY ERROR DETECTED ===')
          console.error('The RLS policy is blocking access to questions')
          console.error('Please verify migration 026_fix_questions_rls_for_adaptive_practice.sql has been applied')
        }
        continue
      }
      
      // Check for RLS issue: count > 0 but questions array is empty
      if ((questionCount || 0) > 0 && (questions?.length || 0) === 0) {
        console.error(`=== RLS ISSUE DETECTED FOR DIFFICULTY ${difficulty} ===`)
        console.error(`Count shows ${questionCount} questions exist, but query returned empty array`)
        console.error('This indicates RLS policy is blocking the SELECT query even though count works')
        console.error('Attempting fallback: Fetch question IDs first, then full details')
        
        // Fallback: Fetch question IDs first, then fetch full details
        const { data: questionIds, error: idError } = await supabaseClient
          .from('questions')
          .select('id')
          .in('subcategory_id', validSubcategories)
          .eq('difficulty', difficulty)
          .limit(100)
        
        if (idError) {
          console.error('Fallback query also failed:', idError)
          continue
        }
        
        if (questionIds && questionIds.length > 0) {
          console.log(`Fallback found ${questionIds.length} question IDs`)
          
          // Try fetching full details for multiple question IDs
          // Filter to only questions with the target difficulty
          const filteredIds = []
          for (const qId of questionIds.slice(0, 10)) {
            const { data: qCheck, error: checkError } = await supabaseClient
              .from('questions')
              .select('id, difficulty')
              .eq('id', qId.id)
              .single()
            
            if (!checkError && qCheck && qCheck.difficulty === difficulty) {
              filteredIds.push(qId.id)
            }
          }
          
          if (filteredIds.length > 0) {
            // Fetch full details for the first matching question
            const { data: fullQuestion, error: fullError } = await supabaseClient
              .from('questions')
              .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id')
              .eq('id', filteredIds[0])
              .single()
            
            if (fullError || !fullQuestion) {
              console.error('Failed to fetch full question details:', fullError)
              // Try alternative: fetch without difficulty filter and filter client-side
              console.log('Trying alternative fallback: fetch all questions and filter client-side')
              const { data: allQuestionsAlt, error: altError } = await supabaseClient
                .from('questions')
                .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id')
                .in('subcategory_id', validSubcategories)
                .limit(100)
              
              if (altError || !allQuestionsAlt || allQuestionsAlt.length === 0) {
                console.error('Alternative fallback also failed:', altError)
                continue
              }
              
              // Filter by difficulty client-side
              const filteredByDifficulty = allQuestionsAlt.filter((q: any) => q.difficulty === difficulty)
              if (filteredByDifficulty.length > 0) {
                questions = filteredByDifficulty
                console.log(`Alternative fallback successful: Found ${filteredByDifficulty.length} questions for difficulty ${difficulty}`)
              } else {
                console.error('No questions found after client-side filtering')
                continue
              }
            } else {
              // Use the fallback question
              questions = [fullQuestion]
              console.log(`Fallback successful: Using question ${filteredIds[0]}`)
            }
          } else {
            console.error('No question IDs matched the target difficulty')
            // Try alternative: fetch without difficulty filter and filter client-side
            console.log('Trying alternative fallback: fetch all questions and filter client-side')
            const { data: allQuestionsAlt, error: altError } = await supabaseClient
              .from('questions')
              .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id')
              .in('subcategory_id', validSubcategories)
              .limit(100)
            
            if (altError || !allQuestionsAlt || allQuestionsAlt.length === 0) {
              console.error('Alternative fallback also failed:', altError)
              continue
            }
            
            // Filter by difficulty client-side
            const filteredByDifficulty = allQuestionsAlt.filter((q: any) => q.difficulty === difficulty)
            if (filteredByDifficulty.length > 0) {
              questions = filteredByDifficulty
              console.log(`Alternative fallback successful: Found ${filteredByDifficulty.length} questions for difficulty ${difficulty}`)
            } else {
              console.error('No questions found after client-side filtering')
              continue
            }
          }
        } else {
          console.error('Fallback query returned empty array')
          // Try alternative: fetch without difficulty filter and filter client-side
          console.log('Trying alternative fallback: fetch all questions and filter client-side')
          const { data: allQuestionsAlt, error: altError } = await supabaseClient
            .from('questions')
            .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id')
            .in('subcategory_id', validSubcategories)
            .limit(100)
          
          if (altError || !allQuestionsAlt || allQuestionsAlt.length === 0) {
            console.error('Alternative fallback also failed:', altError)
            continue
          }
          
          // Filter by difficulty client-side
          const filteredByDifficulty = allQuestionsAlt.filter((q: any) => q.difficulty === difficulty)
          if (filteredByDifficulty.length > 0) {
            questions = filteredByDifficulty
            console.log(`Alternative fallback successful: Found ${filteredByDifficulty.length} questions for difficulty ${difficulty}`)
          } else {
            console.error('No questions found after client-side filtering')
            continue
          }
        }
      }
      
      console.log(`Query successful for difficulty ${difficulty}`)
      console.log(`Found ${questionCount || 0} total questions (returned ${questions?.length || 0})`)
      
      // Add subcategory info to questions manually
      const questionsWithSubcats = (questions || []).map((q: any) => ({
        ...q,
        subcategory: subcatMap.get(q.subcategory_id) || null
      }))

      console.log(`Found ${questionsWithSubcats?.length || 0} questions for difficulty ${difficulty} after adding subcategory info`)

      // Filter out answered questions client-side if needed
      let filteredQuestions = questionsWithSubcats || []
      const beforeFilter = filteredQuestions.length
      
      if (answered_question_ids.length > 0) {
        filteredQuestions = filteredQuestions.filter((q: any) => !answered_question_ids.includes(q.id))
        console.log(`Filtered out ${beforeFilter - filteredQuestions.length} already answered questions`)
        console.log(`Remaining questions after filter: ${filteredQuestions.length}`)
      }

      if (filteredQuestions && filteredQuestions.length > 0) {
        // Pick random question from results
        const randomIndex = Math.floor(Math.random() * filteredQuestions.length)
        nextQuestion = filteredQuestions[randomIndex]
        console.log(`Selected question ${randomIndex + 1} of ${filteredQuestions.length} available`)
        console.log('Question ID:', nextQuestion.id)
        console.log('Question text preview:', nextQuestion['question text']?.substring(0, 50) + '...')
        break
      } else {
        console.log(`No available questions for difficulty ${difficulty} after filtering`)
        console.log(`- Before filter: ${beforeFilter}`)
        console.log(`- After filter: ${filteredQuestions.length}`)
        console.log(`- Answered IDs: ${answered_question_ids.length}`)
      }
      }
    }

    if (!nextQuestion) {
      console.error('=== NO QUESTION FOUND AFTER FILTERING ===')
      console.error('Valid subcategories:', validSubcategories)
      console.error('Current difficulty:', currentDifficulty)
      console.error('Answered question IDs (count):', answered_question_ids.length)
      console.error('Tried difficulties:', difficulties)
      
      // Try one more query without difficulty filter to see if questions exist
      console.log('Attempting final query without difficulty filter...')
      
      // First fetch question IDs (this works)
      const { data: questionIdsFinal, error: idsErrorFinal, count: allCount } = await supabaseClient
        .from('questions')
        .select('id', { count: 'exact' })
        .in('subcategory_id', validSubcategories)
        .limit(10)
      
      let realQuestions: any[] = []
      
      if (idsErrorFinal) {
        console.error('Final query error:', idsErrorFinal)
      } else {
        console.log(`Final query found ${allCount || 0} total questions (found ${questionIdsFinal?.length || 0} IDs)`)
        
        // If we got question IDs, try to fetch full details for them
        if (questionIdsFinal && questionIdsFinal.length > 0) {
          console.log('Attempting to fetch full details for question IDs...')
          const questionIds = questionIdsFinal.map((q: any) => q.id)
          
          // Try fetching full details for the first few IDs
          for (const qId of questionIds.slice(0, 5)) {
            const { data: fullQ, error: fullQError } = await supabaseClient
              .from('questions')
              .select('id, "question text", question_type, "option a", "option b", "option c", "option d", "option e", "correct answer", explanation, marks, difficulty, subcategory_id')
              .eq('id', qId)
              .single()
            
            if (!fullQError && fullQ) {
              realQuestions.push(fullQ)
              console.log(`Successfully fetched question ${qId}`)
            } else {
              console.error(`Failed to fetch question ${qId}:`, fullQError)
            }
          }
          
          if (realQuestions.length > 0) {
            console.log(`Successfully fetched ${realQuestions.length} real questions from database`)
            console.log('Real questions:', realQuestions.map((q: any) => ({
              id: q.id,
              subcategory_id: q.subcategory_id,
              difficulty: q.difficulty,
              has_text: !!q['question text'],
              has_options: !!(q.options || q['option a'] || q['option b'])
            })))
          } else {
            console.error('Could not fetch full details for any question IDs')
          }
        }
      }
      
      // Use real questions if available, otherwise use IDs only
      const serializedSampleQuestions = realQuestions.length > 0 
        ? realQuestions.slice(0, 3).map((q: any) => ({
            id: q.id,
            subcategory_id: q.subcategory_id,
            difficulty: q.difficulty,
          }))
        : (questionIdsFinal?.slice(0, 3).map((q: any) => ({
            id: q.id,
            subcategory_id: q.subcategory_id,
            difficulty: 'unknown', // We don't know difficulty if we can't fetch full details
          })) || [])
      
      const debugInfo = {
        valid_subcategories: validSubcategories || [],
        current_difficulty: currentDifficulty || 'medium',
        answered_count: answered_question_ids.length || 0,
        tried_difficulties: difficulties || [],
        total_questions_in_subcategories: allCount || 0,
        sample_questions: serializedSampleQuestions || [],
        query_error: idsErrorFinal ? {
          message: idsErrorFinal.message || String(idsErrorFinal),
          code: idsErrorFinal.code || undefined,
        } : null,
        real_questions_fetched: realQuestions.length,
        timestamp: new Date().toISOString(),
      }
      
      console.log('Returning exhausted response with debug:', JSON.stringify(debugInfo, null, 2))
      
      return new Response(
        JSON.stringify({
          error: 'No more questions available for selected topics',
          exhausted: true,
          debug: debugInfo,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log('=== Question Successfully Fetched ===')
    console.log('Question ID:', nextQuestion.id)
    console.log('Question difficulty:', nextQuestion.difficulty)
    console.log('Subcategory:', nextQuestion.subcategory?.name || 'Unknown')

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

    // Construct options object from individual columns
    const options = constructOptions(nextQuestion)
    
    // Return response
    return new Response(
      JSON.stringify({
        question: {
          id: nextQuestion.id,
          text: nextQuestion['question text'],
          type: nextQuestion.question_type,
          options: options,
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
  } catch (error: any) {
    console.error('=== CRITICAL ERROR IN EDGE FUNCTION ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    console.error('Error message:', error?.message || String(error))
    console.error('Error stack:', error?.stack)
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    // Return error with debug info
    const errorResponse = {
      error: error?.message || 'An unexpected error occurred',
      exhausted: false,
      debug: {
        error_type: typeof error,
        error_message: error?.message || String(error),
        error_code: error?.code || undefined,
        error_name: error?.name || undefined,
        timestamp: new Date().toISOString(),
      },
    }
    
    console.log('Returning error response:', JSON.stringify(errorResponse))
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
