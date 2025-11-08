import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestAttemptInterface from '@/components/test/TestAttemptInterface'

export default async function TestAttemptPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const supabase = await createClient()
  const { testId } = await params

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch test details
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  if (testError || !test) {
    redirect('/test/mock')
  }

  // Try to get questions from custom_mock_tests first (for custom tests)
  const { data: customTest, error: customTestError } = await supabase
    .from('custom_mock_tests')
    .select('selected_question_ids')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('=== ATTEMPT PAGE DEBUG ===')
  console.log('Test ID:', testId)
  console.log('User ID:', user.id)
  console.log('Custom Test Data:', customTest)
  console.log('Custom Test Error:', customTestError)

  let questions: any[] = []
  
  if (customTest && customTest.selected_question_ids && customTest.selected_question_ids.length > 0) {
    console.log('Found custom test with', customTest.selected_question_ids.length, 'question IDs')
    
    // Fetch questions by IDs from custom test
    const { data: customQuestions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        subcategory:subcategories!questions_subcategory_id_fkey(
          id,
          name,
          category:categories(
            id,
            name
          )
        )
      `)
      .in('id', customTest.selected_question_ids)
    
    console.log('Fetched', customQuestions?.length || 0, 'questions from questions table')
    console.log('Questions Error:', questionsError)
    
    if (customQuestions && customQuestions.length > 0) {
      // Maintain the order of selected_question_ids
      const questionMap = new Map(customQuestions.map((q: any) => [q.id, q]))
      questions = customTest.selected_question_ids
        .map((id: string) => questionMap.get(id))
        .filter((q: any): q is any => q !== undefined)
      
      console.log('Final questions count after mapping:', questions.length)
    }
  } else {
    console.log('No custom test found, trying fallback query')
  }
  
  // Fallback: try to fetch by test_id if no custom test or no questions found
  if (questions.length === 0) {
    console.log('Attempting fallback query with test_id:', testId)
    
    const { data: regularQuestions, error: regularError } = await supabase
      .from('questions')
      .select(`
        *,
        subcategory:subcategories!questions_subcategory_id_fkey(
          id,
          name,
          category:categories(
            id,
            name
          )
        )
      `)
      .eq('test_id', testId)
      .order('created_at', { ascending: true })
    
    console.log('Fallback query returned:', regularQuestions?.length || 0, 'questions')
    console.log('Fallback Error:', regularError)
    
    if (regularQuestions) {
      questions = regularQuestions
    }
  }

  console.log('FINAL QUESTIONS COUNT:', questions.length)
  console.log('=== END DEBUG ===')

  if (!questions || questions.length === 0) {
    console.log('❌ NO QUESTIONS FOUND - REDIRECTING TO INSTRUCTIONS')
    redirect(`/test/${testId}/instructions`)
  }

  // Check for existing attempt (most recent one)
  const { data: existingAttempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <TestAttemptInterface
      test={test}
      questions={questions}
      userId={user.id}
      userProfile={profile}
      existingAttempt={existingAttempt}
    />
  )
}
