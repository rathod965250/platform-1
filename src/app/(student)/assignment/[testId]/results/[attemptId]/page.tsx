import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { TestResults } from '@/components/test/TestResults'

export const metadata = {
  title: 'Test Results',
  description: 'View your test results and performance analysis',
}

interface PageProps {
  params: Promise<{
    testId: string
    attemptId: string
  }>
}

export default async function TestResultsPage({ params }: PageProps) {
  const { testId, attemptId } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch test attempt with user profile
  const { data: attempt, error: attemptError } = await supabase
    .from('test_attempts')
    .select(`
      *,
      user:profiles!test_attempts_user_id_fkey(full_name, email)
    `)
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (attemptError || !attempt) {
    notFound()
  }

  // Check if test is submitted
  if (!attempt.submitted_at) {
    redirect(`/test/${testId}/active/${attemptId}`)
  }

  // Fetch test details
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  if (testError || !test) {
    notFound()
  }

  // Fetch all attempt answers with question details
  const { data: answers, error: answersError } = await supabase
    .from('attempt_answers')
    .select(`
      *,
      question:questions(
        id,
        question_text,
        question_type,
        options,
        correct_answer,
        explanation,
        marks,
        difficulty,
        order,
        subcategory:subcategories(
          id,
          name,
          slug,
          category:categories(
            id,
            name,
            slug
          )
        )
      )
    `)
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (answersError) {
    console.error('Error fetching answers:', answersError)
  }

  // Calculate statistics for all attempts on this test
  const { data: allAttempts } = await supabase
    .from('test_attempts')
    .select('score, time_taken_seconds')
    .eq('test_id', testId)
    .not('submitted_at', 'is', null)

  // Calculate average and top scores
  const avgScore = allAttempts?.length
    ? allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length
    : 0

  const topScore = allAttempts?.length
    ? Math.max(...allAttempts.map((a) => a.score))
    : 0

  return (
    <TestResults
      attempt={attempt}
      test={test}
      answers={answers || []}
      avgScore={avgScore}
      topScore={topScore}
      totalAttempts={allAttempts?.length || 0}
    />
  )
}

