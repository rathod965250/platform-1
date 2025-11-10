import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TestResults } from '@/components/test/TestResults'

export default async function TestResultsPage({
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

  if (testError) {
    console.error('Error fetching test:', testError?.message || testError?.code || 'Unknown error')
  }

  if (!test) {
    console.log('Test not found, redirecting to mock test page')
    redirect('/test/mock')
  }

  // Fetch user's latest attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()

  if (attemptError) {
    console.error('Error fetching attempt:', attemptError?.message || attemptError?.code || 'Unknown error')
  }

  if (!attempt) {
    console.log('No completed attempt found for test:', testId, 'user:', user.id)
    redirect(`/test/${testId}/instructions`)
  }

  console.log('Attempt found:', {
    id: attempt.id,
    score: attempt.score,
    correct_answers: attempt.correct_answers,
    total_questions: attempt.total_questions,
    submitted_at: attempt.submitted_at
  })

  // Fetch answers with questions
  const { data: answers, error: answersError } = await supabase
    .from('attempt_answers')
    .select(`
      *,
      questions!question_id(
        *,
        subcategories!questions_subcategory_id_fkey(
          id,
          name,
          categories!subcategories_category_id_fkey(
            id,
            name
          )
        )
      )
    `)
    .eq('attempt_id', attempt.id)

  if (answersError) {
    console.error('Error fetching answers:', answersError?.message || answersError?.code || 'Unknown error')
  }

  console.log('Answers fetched:', answers?.length || 0, 'answers')

  // Fetch statistics for comparison
  const { data: allAttempts } = await supabase
    .from('test_attempts')
    .select('score')
    .eq('test_id', testId)
    .not('submitted_at', 'is', null)

  const avgScore = allAttempts && allAttempts.length > 0
    ? allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length
    : 0

  const topScore = allAttempts && allAttempts.length > 0
    ? Math.max(...allAttempts.map(a => a.score || 0))
    : 0

  const totalAttempts = allAttempts?.length || 0

  return (
    <TestResults
      test={test}
      attempt={attempt}
      answers={answers || []}
      avgScore={avgScore}
      topScore={topScore}
      totalAttempts={totalAttempts}
    />
  )
}
