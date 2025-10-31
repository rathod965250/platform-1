import { createClient } from '@/lib/supabase/server'
import { QuestionForm } from '@/components/admin/QuestionForm'

export const metadata = {
  title: 'Add Question',
  description: 'Create a new question',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NewQuestionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch tests and subcategories for the form
  const [
    { data: tests },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('tests')
      .select('id, title, slug')
      .order('title'),
    supabase
      .from('categories')
      .select('id, name, slug, subcategories(id, name, slug)')
      .order('order'),
  ])

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Add New Question
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new question for your tests
        </p>
      </div>

      <QuestionForm 
        tests={tests || []} 
        categories={categories || []}
        initialTestId={params.testId as string}
      />
    </div>
  )
}

