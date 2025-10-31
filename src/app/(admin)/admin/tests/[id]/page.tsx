import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, Plus } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ViewTestPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the test with questions
  const { data: test, error } = await supabase
    .from('tests')
    .select(`
      *,
      category:categories(name),
      questions(id, question_text, question_type, difficulty, marks)
    `)
    .eq('id', id)
    .single()

  if (error || !test) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {test.title}
            </h1>
            <Badge variant={test.is_published ? 'default' : 'secondary'}>
              {test.is_published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          {test.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {test.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/tests/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Test Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Details
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Test Type</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {test.test_type === 'mock' && 'Mock Test'}
              {test.test_type === 'practice' && 'Practice'}
              {test.test_type === 'company_specific' && `Company Specific - ${test.company_name}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {test.category?.name || 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Duration</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {test.duration_minutes} minutes
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Marks</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {test.total_marks}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Negative Marking</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {test.negative_marking ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Questions</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {test.questions?.length || 0}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Questions List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Questions ({test.questions?.length || 0})
          </h2>
          <Link href={`/admin/questions/new?testId=${id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </Link>
        </div>

        {!test.questions || test.questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No questions added yet</p>
            <Link href={`/admin/questions/new?testId=${id}`}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Question
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {test.questions.map((question: any, index: number) => (
              <Link
                key={question.id}
                href={`/admin/questions/${question.id}`}
                className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Q{index + 1}.
                      </span>
                      <p className="text-gray-900 dark:text-white line-clamp-2">
                        {question.question_text}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge variant="outline" className="capitalize">
                      {question.question_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {question.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

