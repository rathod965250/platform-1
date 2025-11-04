import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, Brain, BookOpen, BarChart3, Lightbulb } from 'lucide-react'
import { logAdminError, extractErrorDetails } from '@/lib/admin/error-handler'
import { ErrorDisplay } from '@/components/admin/ErrorDisplay'

export const metadata = {
  title: 'Categories & Subcategories',
  description: 'View all categories and subcategories',
}

const iconMap: Record<string, any> = {
  Calculator,
  Brain,
  BookOpen,
  BarChart3,
  Lightbulb,
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(*)
    `)
    .order('order')

  if (error) {
    logAdminError('CategoriesPage', error)
  }

  const errorDetails = error ? extractErrorDetails(error) : null

  // Get question counts for each subcategory
  const { data: questionCounts, error: questionCountsError } = await supabase
    .from('questions')
    .select('subcategory_id')

  if (questionCountsError) {
    logAdminError('CategoriesPage (question counts)', questionCountsError)
  }

  const countsBySubcategory = questionCounts?.reduce((acc: any, q) => {
    acc[q.subcategory_id] = (acc[q.subcategory_id] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Categories & Subcategories
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View all seeded categories and their subcategories
        </p>
      </div>

      {/* Error Display */}
      {errorDetails && <ErrorDisplay error={errorDetails} context="Categories" />}

      {/* Categories List */}
      {!errorDetails && (
        <>
          <div className="grid gap-6">
            {categories?.map((category) => {
              const Icon = iconMap[category.icon] || Calculator
              const subcategories = category.subcategories || []
              
              return (
                <Card key={category.id} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    {/* Category Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </h2>
                        <Badge variant="secondary">
                          {subcategories.length} {subcategories.length === 1 ? 'subcategory' : 'subcategories'}
                        </Badge>
                      </div>
                      
                      {category.description && (
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          {category.description}
                        </p>
                      )}

                      {/* Subcategories */}
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {subcategories
                          .sort((a: any, b: any) => a.order - b.order)
                          .map((subcategory: any) => {
                            const questionCount = countsBySubcategory[subcategory.id] || 0
                            return (
                              <div
                                key={subcategory.id}
                                className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {subcategory.name}
                                  </span>
                                  <Badge variant="outline" className="ml-2">
                                    {questionCount} Q
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  /{subcategory.slug}
                                </p>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Info Box */}
          <Card className="p-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              ℹ️ About Categories
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              These categories and subcategories were automatically seeded during database setup.
              Questions are organized by subcategories, and tests can be filtered by categories.
              Create questions for each subcategory to build your question bank.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

