import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { MockTestBuilder } from '@/components/test/MockTestBuilder'

export const metadata: Metadata = {
  title: 'Create Mock Test | Aptitude Preparation Platform',
  description: 'Create custom mock tests by selecting categories, subcategories, and difficulty levels.',
}

export default async function MockTestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all categories with their subcategories
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      subcategories(
        id,
        name,
        slug
      )
    `)
    .order('name', { ascending: true })

  return <MockTestBuilder categories={categories || []} userId={user.id} />
}

