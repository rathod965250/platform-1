import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestInstructions from '@/components/test/TestInstructions'

export default async function TestInstructionsPage({
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

  // Check if user has already started this test
  const { data: existingAttempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .single()

  // Try to get questions count from custom_mock_tests first (for custom tests)
  const { data: customTest } = await supabase
    .from('custom_mock_tests')
    .select('total_questions, selected_question_ids')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .single()

  // If it's a custom test, use the stored question count, otherwise query questions table
  let questionsCount = 0
  if (customTest && customTest.selected_question_ids) {
    questionsCount = customTest.selected_question_ids.length
  } else {
    // Fallback to counting questions in the questions table
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId)
    questionsCount = count || 0
  }

  return (
    <TestInstructions
      test={test}
      questionsCount={questionsCount}
      hasExistingAttempt={!!existingAttempt}
      userId={user.id}
    />
  )
}
