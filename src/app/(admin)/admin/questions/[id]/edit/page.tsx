import { createClient } from '@/lib/supabase/server'
import { QuestionForm } from '@/components/admin/QuestionForm'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Edit Question',
  description: 'Edit question details',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the question
  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !question) {
    notFound()
  }

  // Fetch tests and categories for the form
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
          Edit Question
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update question details
        </p>
      </div>

      <QuestionForm 
        tests={tests || []} 
        categories={categories || []}
        initialData={question}
      />
    </div>
  )
}

