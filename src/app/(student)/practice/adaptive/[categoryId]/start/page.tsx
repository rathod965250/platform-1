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
  }>
}

export default async function AdaptivePracticePage({ params, searchParams }: PageProps) {
  const { categoryId } = await params
  const { sessionId, topics } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (!sessionId || !topics) {
    redirect(`/practice/configure/${categoryId}`)
  }

  const selectedSubcategories = topics.split(',').filter(Boolean)

  // Fetch category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  // Fetch subcategories for display
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('id, name')
    .in('id', selectedSubcategories)

  // Verify session exists and belongs to user
  const { data: session } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    redirect(`/practice/configure/${categoryId}`)
  }

  return (
    <AdaptivePracticeInterface
      category={category}
      sessionId={sessionId}
      selectedSubcategories={selectedSubcategories}
      subcategories={subcategories || []}
    />
  )
}

