import { createClient } from '@/lib/supabase/server'
import { TestForm } from '@/components/admin/TestForm'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Edit Test',
  description: 'Edit test details',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditTestPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the test
  const { data: test, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !test) {
    notFound()
  }

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('order')

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Test
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update test details
        </p>
      </div>

      <TestForm categories={categories || []} initialData={test} />
    </div>
  )
}

