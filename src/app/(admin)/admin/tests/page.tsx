import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { DeleteTestButton } from '@/components/admin/DeleteTestButton'
import { logAdminError, extractErrorDetails } from '@/lib/admin/error-handler'
import { ErrorDisplay } from '@/components/admin/ErrorDisplay'
import { sanitizeSupabaseResult, extractRelationship } from '@/lib/supabase/utils'

export const metadata = {
  title: 'Manage Tests',
  description: 'Create and manage tests',
}

export default async function TestsPage() {
  const supabase = await createClient()

  const { data: testsRaw, error } = await supabase
    .from('tests')
    .select(`
      *,
      category:categories(name),
      questions!questions_test_id_fkey(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    logAdminError('TestsPage', error)
  }

  const errorDetails = error ? extractErrorDetails(error) : null

  // Sanitize tests - filter out Supabase metadata from relationships
  const tests = sanitizeSupabaseResult(testsRaw || []).map((test: any) => {
    // Extract category relationship safely
    const category = extractRelationship(test.category)
    // Extract questions relationship safely (might be array or metadata)
    let questions = test.questions
    if (questions) {
      if (Array.isArray(questions)) {
        // Filter out metadata objects
        questions = questions.filter((q: any) => {
          if (!q || typeof q !== 'object') return false
          return !('cardinality' in q) && !('embedding' in q) && !('relationship' in q)
        })
      } else if (typeof questions === 'object') {
        // Check if it's metadata
        if ('cardinality' in questions || 'embedding' in questions || 'relationship' in questions) {
          questions = []
        }
      }
    }
    
    return {
      ...test,
      category: category && typeof category === 'object' && 'name' in category 
        ? { name: category.name } 
        : null,
      questions: questions || [],
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tests Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage tests for your platform
          </p>
        </div>
        <Link href="/admin/tests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </Link>
      </div>

      {/* Error Display */}
      {errorDetails && <ErrorDisplay error={errorDetails} context="Tests" />}

      {/* Tests List */}
      {!errorDetails && (
        (!tests || tests.length === 0) ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tests yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get started by creating your first test
            </p>
            <Link href="/admin/tests/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tests.map((test: any) => (
              <Card key={test.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {test.title}
                      </h3>
                      <Badge variant={test.is_published ? 'default' : 'secondary'}>
                        {test.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant="outline">
                        {test.test_type === 'mock' && 'Mock Test'}
                        {test.test_type === 'practice' && 'Practice'}
                        {test.test_type === 'company_specific' && test.company_name}
                      </Badge>
                    </div>
                    
                    {test.description && (
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {test.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {test.category && (
                        <span>📚 Category: {test.category.name}</span>
                      )}
                      <span>⏱️ Duration: {test.duration_minutes} mins</span>
                      <span>📝 Questions: {test.questions?.[0]?.count || 0}</span>
                      <span>💯 Total Marks: {test.total_marks}</span>
                      {test.negative_marking && (
                        <span className="text-red-600">❌ Negative Marking</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/tests/${test.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/tests/${test.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteTestButton testId={test.id} testTitle={test.title} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function FileText({ className }: { className?: string }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

