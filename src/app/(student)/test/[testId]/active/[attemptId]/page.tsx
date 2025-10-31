import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ActiveTestInterface } from '@/components/test/ActiveTestInterface'

export const metadata = {
  title: 'Test In Progress',
  description: 'Complete your test',
}

interface PageProps {
  params: Promise<{
    testId: string
    attemptId: string
  }>
}

export default async function ActiveTestPage({ params }: PageProps) {
  const { testId, attemptId } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch test attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (attemptError || !attempt) {
    notFound()
  }

  // Check if already submitted
  if (attempt.submitted_at) {
    redirect(`/test/${testId}/results/${attemptId}`)
  }

  // Fetch test with questions
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select(`
      *,
      questions(
        id,
        question_text,
        question_type,
        options,
        correct_answer,
        explanation,
        marks,
        difficulty,
        order,
        subcategory:subcategories(name, category:categories(name))
      )
    `)
    .eq('id', testId)
    .single()

  if (testError || !test) {
    notFound()
  }

  // Sort questions by order
  const questions = test.questions?.sort((a: any, b: any) => a.order - b.order) || []

  // Fetch existing answers
  const { data: existingAnswers } = await supabase
    .from('attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId)

  // Convert to object for easy lookup
  const answersMap: Record<string, any> = {}
  existingAnswers?.forEach((answer) => {
    answersMap[answer.question_id] = answer
  })

  return (
    <ActiveTestInterface
      test={test}
      attempt={attempt}
      questions={questions}
      existingAnswers={answersMap}
    />
  )
}

