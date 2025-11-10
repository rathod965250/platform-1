import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TestResults } from '@/components/test/TestResults'

export default async function AttemptResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const supabase = await createClient()
  const { attemptId } = await params

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch attempt details
  const { data: attempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (!attempt) {
    console.log('Attempt not found or unauthorized')
    redirect('/test')
  }

  // Fetch test details
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', attempt.test_id)
    .single()

  if (!test) {
    redirect('/test')
  }

  // Fetch answers with questions
  const { data: answers } = await supabase
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

  // Fetch statistics for comparison
  const { data: allAttempts } = await supabase
    .from('test_attempts')
    .select('score')
    .eq('test_id', attempt.test_id)
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
