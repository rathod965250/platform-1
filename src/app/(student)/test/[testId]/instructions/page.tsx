import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestInstructions from '@/components/test/TestInstructions'

export default async function TestInstructionsPage({
  params,
}: {
  params: { testId: string }
}) {
  const supabase = await createClient()

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
    .eq('id', params.testId)
    .single()

  if (testError || !test) {
    redirect('/test/mock')
  }

  // Check if user has already started this test
  const { data: existingAttempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', params.testId)
    .eq('user_id', user.id)
    .single()

  // Fetch questions count
  const { count: questionsCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', params.testId)

  return (
    <TestInstructions
      test={test}
      questionsCount={questionsCount || 0}
      hasExistingAttempt={!!existingAttempt}
      userId={user.id}
    />
  )
}
