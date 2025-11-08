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
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single()

  if (!test) {
    redirect('/test/mock')
  }

  // Fetch user's latest attempt
  const { data: attempt } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()

  if (!attempt) {
    console.log('No completed attempt found, redirecting to instructions')
    redirect(`/test/${testId}/instructions`)
  }

  // Fetch answers with questions
  const { data: answers } = await supabase
    .from('attempt_answers')
    .select(`
      *,
      question:questions(
        *,
        subcategory:subcategories!questions_subcategory_id_fkey(
          id,
          name,
          category:categories(
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
