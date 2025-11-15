import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ActiveTestInterface } from '@/components/test/ActiveTestInterface'
import { sanitizeSupabaseResult, extractRelationship } from '@/lib/supabase/utils'

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
  const { data: testRaw, error: testError } = await supabase
    .from('tests')
    .select(`
      *,
      questions!questions_test_id_fkey(
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

  if (testError || !testRaw) {
    notFound()
  }

  // Sanitize test questions - filter out Supabase metadata
  let questionsRaw = testRaw.questions
  if (questionsRaw && Array.isArray(questionsRaw)) {
    questionsRaw = questionsRaw.filter((q: any) => {
      if (!q || typeof q !== 'object') return false
      return !('cardinality' in q) && !('embedding' in q) && !('relationship' in q)
    })
  } else if (questionsRaw && typeof questionsRaw === 'object') {
    if ('cardinality' in questionsRaw || 'embedding' in questionsRaw || 'relationship' in questionsRaw) {
      questionsRaw = []
    }
  }

  // Sanitize each question's nested relationships
  const questions = (questionsRaw || []).map((question: any) => {
    const subcategory = extractRelationship(question.subcategory)
    if (subcategory && typeof subcategory === 'object') {
      const rawCategory = 'category' in subcategory ? subcategory.category : null
      const category = extractRelationship(rawCategory)
      return {
        ...question,
        subcategory: {
          name: subcategory.name,
          category: category && typeof category === 'object' && 'name' in category
            ? { name: category.name }
            : null,
        },
      }
    }
    return {
      ...question,
      subcategory: subcategory && typeof subcategory === 'object'
        ? { name: subcategory.name }
        : null,
    }
  }).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

  const test = {
    ...testRaw,
    questions,
  }

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

