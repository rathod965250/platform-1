import { createClient } from '@/lib/supabase/server'
import { TestForm } from '@/components/admin/TestForm'

export const metadata = {
  title: 'Create Test',
  description: 'Create a new test',
}

export default async function NewTestPage() {
  const supabase = await createClient()

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('order')

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Test
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Fill in the details to create a new test
        </p>
      </div>

      <TestForm categories={categories || []} />
    </div>
  )
}

