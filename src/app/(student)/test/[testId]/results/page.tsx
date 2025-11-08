import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestResults from '@/components/test/TestResults'

export default async function TestResultsPage({
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
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', params.testId)
    .single()

  if (!test) {
    redirect('/test/mock')
  }

  // Fetch user's latest attempt
  const { data: attempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', params.testId)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (!attempt) {
    redirect(`/test/${params.testId}/instructions`)
  }

  // Fetch answers with questions
  const { data: answers } = await supabase
    .from('test_answers')
    .select(`
      *,
      question:questions(
        *,
        subcategory:subcategories(
          id,
          name,
          category:categories(
            id,
            name
          )
        )
      )
    `)
    .eq('test_attempt_id', attempt.id)

  return (
    <TestResults
      test={test}
      attempt={attempt}
      answers={answers || []}
      userId={user.id}
    />
  )
}
