'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Brain, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function PracticeConfigurePage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string
  const supabase = createClient()

  const [category, setCategory] = useState<any>(null)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch category
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single()

        setCategory(categoryData)

        // Fetch subcategories
        const { data: subcategoriesData } = await supabase
          .from('subcategories')
          .select(`
            *,
            questions:questions(count)
          `)
          .eq('category_id', categoryId)
          .order('order', { ascending: true })

        // Get question counts per subcategory
        const { data: allQuestions } = await supabase
          .from('questions')
          .select('subcategory_id')
          .in('subcategory_id', subcategoriesData?.map(s => s.id) || [])

        const questionCounts: Record<string, number> = {}
        allQuestions?.forEach((q: any) => {
          questionCounts[q.subcategory_id] = (questionCounts[q.subcategory_id] || 0) + 1
        })

        const subcategoriesWithCounts = subcategoriesData?.map(sub => ({
          ...sub,
          questionCount: questionCounts[sub.id] || 0,
        })) || []

        setSubcategories(subcategoriesWithCounts)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load topics')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId, supabase])

  const handleToggleSubcategory = (subcategoryId: string) => {
    setSelectedSubcategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId)
      } else {
        newSet.add(subcategoryId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedSubcategories.size === subcategories.length) {
      setSelectedSubcategories(new Set())
    } else {
      setSelectedSubcategories(new Set(subcategories.map(s => s.id)))
    }
  }

  const handleStartPractice = async () => {
    if (selectedSubcategories.size === 0) {
      toast.error('Please select at least one topic')
      return
    }

    setStarting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Create practice session
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          total_questions: 0, // Will be updated as questions are answered
          correct_answers: 0,
          config: {
            selected_subcategories: Array.from(selectedSubcategories),
            mode: 'adaptive',
          },
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Navigate to practice interface with session ID and selected topics
      const selectedIds = Array.from(selectedSubcategories).join(',')
      router.push(`/practice/adaptive/${categoryId}/start?sessionId=${session.id}&topics=${selectedIds}`)
    } catch (error: any) {
      console.error('Error starting practice:', error)
      toast.error(error.message || 'Failed to start practice session')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/practice" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to Topics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Configure Practice Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {category?.name} - Select topics you want to practice
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Topics</CardTitle>
                <CardDescription>
                  Choose the subcategories you want to practice. The adaptive algorithm will adjust difficulty based on your performance.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedSubcategories.size === subcategories.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subcategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No topics available for this category yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedSubcategories.has(subcategory.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleToggleSubcategory(subcategory.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox
                        checked={selectedSubcategories.has(subcategory.id)}
                        onCheckedChange={() => handleToggleSubcategory(subcategory.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <Label className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer">
                          {subcategory.name}
                        </Label>
                        {subcategory.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {subcategory.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {subcategory.questionCount || 0} questions
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedSubcategories.size === 0 ? (
                  <span className="text-red-600 dark:text-red-400">Select at least one topic</span>
                ) : (
                  <span>
                    {selectedSubcategories.size} topic{selectedSubcategories.size !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleStartPractice}
                disabled={selectedSubcategories.size === 0 || starting}
              >
                {starting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Adaptive Practice'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

