import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, Filter } from 'lucide-react'
import Link from 'next/link'
import { DeleteQuestionButton } from '@/components/admin/DeleteQuestionButton'

export const metadata = {
  title: 'Manage Questions',
  description: 'Create and manage questions',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function QuestionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('questions')
    .select(`
      *,
      test:tests(title, slug),
      subcategory:subcategories(name, category:categories(name))
    `)
    .order('created_at', { ascending: false })

  // Filter by test_id if provided
  if (params.testId) {
    query = query.eq('test_id', params.testId)
  }

  const { data: questions, error } = await query

  if (error) {
    console.error('Error fetching questions:', error)
  }

  // Get unique test filter options
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title')
    .order('title')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Questions Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage questions for tests
          </p>
        </div>
        <Link href="/admin/questions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {tests && tests.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/questions">
                <Badge variant={!params.testId ? 'default' : 'outline'}>
                  All Questions
                </Badge>
              </Link>
              {tests.map((test) => (
                <Link key={test.id} href={`/admin/questions?testId=${test.id}`}>
                  <Badge variant={params.testId === test.id ? 'default' : 'outline'}>
                    {test.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Questions List */}
      {!questions || questions.length === 0 ? (
        <Card className="p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No questions yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get started by adding your first question
          </p>
          <Link href="/admin/questions/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Question Number */}
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-200">
                    {index + 1}
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {question.question_text}
                      </p>
                      
                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="capitalize">
                          {question.question_type.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`capitalize ${
                            question.difficulty === 'easy' ? 'border-green-500 text-green-700' :
                            question.difficulty === 'medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-red-500 text-red-700'
                          }`}
                        >
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                        </Badge>
                        {question.subcategory && (
                          <Badge variant="secondary">
                            {question.subcategory.category?.name} → {question.subcategory.name}
                          </Badge>
                        )}
                        {question.test && (
                          <Badge variant="secondary">
                            {question.test.title}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/admin/questions/${question.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/questions/${question.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteQuestionButton 
                        questionId={question.id}
                        questionText={question.question_text}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function HelpCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

