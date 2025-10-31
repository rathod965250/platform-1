import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, Check, X } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ViewQuestionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the question with related data
  const { data: question, error } = await supabase
    .from('questions')
    .select(`
      *,
      test:tests(title, slug),
      subcategory:subcategories(name, category:categories(name))
    `)
    .eq('id', id)
    .single()

  if (error || !question) {
    notFound()
  }

  const options = question.options as any

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Question Details
          </h1>
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
          </div>
        </div>
        <Link href={`/admin/questions/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Question
          </Button>
        </Link>
      </div>

      {/* Question Card */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Category Info */}
          <div className="flex gap-4 text-sm">
            {question.subcategory && (
              <div>
                <span className="text-gray-500">Category:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {question.subcategory.category?.name} → {question.subcategory.name}
                </span>
              </div>
            )}
            {question.test && (
              <div>
                <span className="text-gray-500">Test:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {question.test.title}
                </span>
              </div>
            )}
          </div>

          {/* Question Text */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Question</h2>
            <p className="text-lg text-gray-900 dark:text-white">
              {question.question_text}
            </p>
          </div>

          {/* Options */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Options</h2>
            <div className="space-y-2">
              {question.question_type === 'mcq' && options.options && (
                <div className="space-y-2">
                  {options.options.map((option: string, index: number) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        option === question.correct_answer
                          ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 font-semibold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1 text-gray-900 dark:text-white">
                        {option}
                      </span>
                      {option === question.correct_answer && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {question.question_type === 'true_false' && (
                <div className="space-y-2">
                  {['True', 'False'].map((option) => (
                    <div 
                      key={option} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        option === question.correct_answer
                          ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className="flex-1 text-gray-900 dark:text-white">
                        {option}
                      </span>
                      {option === question.correct_answer && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {question.question_type === 'fill_blank' && (
                <div className="p-3 rounded-lg border border-green-500 bg-green-50 dark:bg-green-900/20">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {question.correct_answer}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Correct Answer */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Correct Answer</h2>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-500 dark:bg-green-900/20">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-gray-900 dark:text-white font-medium">
                {question.correct_answer}
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Explanation</h2>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

