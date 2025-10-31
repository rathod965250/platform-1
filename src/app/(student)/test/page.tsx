import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Building2, Upload } from 'lucide-react'
import Link from 'next/link'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Take Test',
  description: 'Choose from mock tests or company-specific aptitude tests. Experience real exam-like conditions with timed tests and detailed analytics.',
  openGraph: {
    title: 'Take Test | Aptitude Preparation Platform',
    description: 'Choose from mock tests or company-specific aptitude tests from TCS, Infosys, Wipro, Accenture, and Cognizant.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Take Test | Aptitude Preparation Platform',
    description: 'Practice with real exam-like mock tests and company-specific questions.',
  },
}

export default async function TestSelectionPage() {
  const supabase = await createClient()

  // Fetch published tests
  const { data: tests } = await supabase
    .from('tests')
    .select(`
      *,
      category:categories(name),
      questions(count)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Group tests by type
  const mockTests = tests?.filter(t => t.test_type === 'mock') || []
  const companyTests = tests?.filter(t => t.test_type === 'company_specific') || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Choose Test Type
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Select the type of test you want to take
          </p>
        </div>

        {/* Test Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* All Questions / Mock Tests */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Mock Tests
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mixed topics from all categories
              </p>
              <Badge variant="secondary" className="mb-4">
                {mockTests.length} {mockTests.length === 1 ? 'test' : 'tests'} available
              </Badge>
              <Link href="#mock-tests" className="w-full">
                <Button className="w-full">Select</Button>
              </Link>
            </div>
          </Card>

          {/* Company Specific */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Company Specific
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Previous year company questions
              </p>
              <Badge variant="secondary" className="mb-4">
                {companyTests.length} {companyTests.length === 1 ? 'test' : 'tests'} available
              </Badge>
              <Link href="#company-tests" className="w-full">
                <Button className="w-full">Select</Button>
              </Link>
            </div>
          </Card>

          {/* Custom Test */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-60">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Custom Test
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your own question paper
              </p>
              <Badge variant="outline" className="mb-4">
                Coming Soon
              </Badge>
              <Button className="w-full" disabled>
                Select
              </Button>
            </div>
          </Card>
        </div>

        {/* Mock Tests List */}
        {mockTests.length > 0 && (
          <div id="mock-tests" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Mock Tests
            </h2>
            <div className="grid gap-4">
              {mockTests.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {test.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {test.category && (
                          <span>📚 {test.category.name}</span>
                        )}
                        <span>⏱️ {test.duration_minutes} mins</span>
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                        <span>💯 {test.total_marks} marks</span>
                        {test.negative_marking && (
                          <span className="text-red-600">❌ Negative Marking</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button>
                        Start Test
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Company Specific Tests List */}
        {companyTests.length > 0 && (
          <div id="company-tests">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Company Specific Tests
            </h2>
            <div className="grid gap-4">
              {companyTests.map((test) => (
                <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {test.title}
                        </h3>
                        {test.company_name && (
                          <Badge variant="default">{test.company_name}</Badge>
                        )}
                      </div>
                      {test.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {test.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {test.category && (
                          <span>📚 {test.category.name}</span>
                        )}
                        <span>⏱️ {test.duration_minutes} mins</span>
                        <span>📝 {test.questions?.[0]?.count || 0} questions</span>
                        <span>💯 {test.total_marks} marks</span>
                        {test.negative_marking && (
                          <span className="text-red-600">❌ Negative Marking</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/test/${test.id}/instructions`}>
                      <Button>
                        Start Test
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Tests Available */}
        {(!tests || tests.length === 0) && (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tests available yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please check back later for new tests
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

