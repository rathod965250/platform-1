import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdaptivePracticeInterface } from '@/components/practice/AdaptivePracticeInterface'

export const metadata = {
  title: 'Adaptive Practice | Aptitude Preparation Platform',
  description: 'Practice with adaptive difficulty adjustment',
}

interface PageProps {
  params: Promise<{
    categoryId: string
  }>
  searchParams: Promise<{
    sessionId?: string
    topics?: string
    questionCount?: string
  }>
}

export default async function AdaptivePracticePage({ params, searchParams }: PageProps) {
  const { categoryId } = await params
  const { sessionId, topics, questionCount } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch category by ID
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (categoryError || !category) {
    redirect('/practice')
  }

  if (!sessionId || !topics) {
    // Redirect to configure page if session or topics are missing
    redirect(`/practice/configure/${category.id}`)
  }

  const selectedSubcategories = topics.split(',').filter(Boolean)

  if (selectedSubcategories.length === 0) {
    redirect(`/practice/configure/${category.id}`)
  }

  // Fetch subcategories for display
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, name')
    .in('id', selectedSubcategories)

  // Verify session exists and belongs to user
  const { data: session, error: sessionError } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    redirect(`/practice/configure/${category.id}`)
  }

  return (
    <AdaptivePracticeInterface
      category={category}
      sessionId={sessionId}
      selectedSubcategories={selectedSubcategories}
      subcategories={subcategories || []}
      questionCount={questionCount ? parseInt(questionCount) : 30}
    />
  )
}

