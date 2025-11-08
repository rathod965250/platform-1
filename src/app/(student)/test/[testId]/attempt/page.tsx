import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestAttemptInterface from '@/components/test/TestAttemptInterface'

export default async function TestAttemptPage({
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

  // Fetch all questions for this test
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      *,
      subcategory:subcategories(
        id,
        name,
        category:categories(
          id,
          name
        )
      )
    `)
    .eq('test_id', params.testId)
    .order('created_at', { ascending: true })

  if (questionsError || !questions || questions.length === 0) {
    redirect(`/test/${params.testId}/instructions`)
  }

  // Check for existing attempt
  const { data: existingAttempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', params.testId)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .single()

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
