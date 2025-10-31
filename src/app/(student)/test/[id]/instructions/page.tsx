import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound, redirect } from 'next/navigation'
import { StartTestButton } from '@/components/test/StartTestButton'

export const metadata = {
  title: 'Test Instructions',
  description: 'Read instructions before starting the test',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TestInstructionsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch test details with questions
  const { data: test, error } = await supabase
    .from('tests')
    .select(`
      *,
      category:categories(name),
      questions(id)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error || !test) {
    notFound()
  }

  const questionCount = test.questions?.length || 0

  if (questionCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No questions available
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This test doesn&apos;t have any questions yet.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {test.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {test.company_name && (
              <Badge variant="default">{test.company_name}</Badge>
            )}
            {test.category && (
              <Badge variant="outline">{test.category.name}</Badge>
            )}
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📋 Test Instructions
          </h2>

          {/* Test Details */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Test Details:
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• <strong>Total Questions:</strong> {questionCount}</li>
              <li>• <strong>Time Limit:</strong> {test.duration_minutes} minutes</li>
              <li>• <strong>Total Marks:</strong> {test.total_marks}</li>
              <li>
                • <strong>Marking Scheme:</strong>{' '}
                {test.negative_marking
                  ? '+1 for correct, -0.25 for incorrect'
                  : '+1 for correct, 0 for incorrect (no negative marking)'}
              </li>
            </ul>
          </div>

          {/* Important Guidelines */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Important Guidelines:
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>Each question has 4 options (A, B, C, D) or True/False</li>
              <li>You can navigate between questions using the question palette</li>
              <li>You can mark questions for review and come back to them later</li>
              <li>Your answers are auto-saved as you progress</li>
              <li>Make sure to submit the test before time expires</li>
              <li>Once submitted, you cannot change your answers</li>
              <li>The test will auto-submit when time runs out</li>
            </ul>
          </div>

          {/* Question Palette Legend */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Question Palette Legend:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
                  1
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Answered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-semibold">
                  2
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Marked for Review
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-semibold">
                  3
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Not Answered (Visited)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-semibold">
                  4
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Not Visited
                </span>
              </div>
            </div>
          </div>

          {/* System Compatibility Check */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              System Compatibility Check:
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Internet Connection: Stable</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Browser: Compatible</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Screen Resolution: Optimal</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Start Test Button */}
        <StartTestButton testId={test.id} />
      </div>
    </div>
  )
}

