'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Brain, ChevronLeft, AlertCircle } from 'lucide-react'
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
  const [showTopicWarning, setShowTopicWarning] = useState(false)
  const [topicsWithoutQuestions, setTopicsWithoutQuestions] = useState<string[]>([])
  const [validTopicIds, setValidTopicIds] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(30)
  const [questionCountInput, setQuestionCountInput] = useState('30')

  useEffect(() => {
    async function fetchData() {
      if (!categoryId) return
      
      try {
        setLoading(true)
        
        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single()

        if (categoryError) {
          console.error('Error fetching category:', categoryError)
          toast.error('Failed to load category')
          return
        }

        setCategory(categoryData)

        // Fetch subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryId)
          .order('order', { ascending: true })

        if (subcategoriesError) {
          console.error('Error fetching subcategories:', subcategoriesError)
          toast.error('Failed to load topics')
          setSubcategories([])
          return
        }

        if (!subcategoriesData || subcategoriesData.length === 0) {
          setSubcategories([])
          return
        }

        // Get question counts per subcategory
        const subcategoryIds = subcategoriesData.map(s => s.id)
        const { data: allQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('subcategory_id')
          .in('subcategory_id', subcategoryIds)

        if (questionsError) {
          console.error('Error fetching question counts:', questionsError)
        }

        const questionCounts: Record<string, number> = {}
        allQuestions?.forEach((q: any) => {
          if (q.subcategory_id) {
            questionCounts[q.subcategory_id] = (questionCounts[q.subcategory_id] || 0) + 1
          }
        })

        const subcategoriesWithCounts = subcategoriesData.map(sub => ({
          ...sub,
          questionCount: questionCounts[sub.id] || 0,
        }))

        setSubcategories(subcategoriesWithCounts)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load topics')
        setSubcategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId])

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

      // Check which topics have questions
      console.log('=== Checking Question Availability ===')
      console.log('Selected subcategories (count):', selectedSubcategories.size)
      console.log('Selected subcategory IDs:', Array.from(selectedSubcategories))
      
      const selectedIds = Array.from(selectedSubcategories)
      
      // Validate UUIDs
      const validUUIDs = selectedIds.filter(id => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(id)
      })
      console.log('Valid UUIDs (count):', validUUIDs.length)
      
      // Query questions - RLS policy will filter to allow authenticated users
      let questionsData: any[] = []
      let questionsError: any = null
      let topicsWithQuestions = new Set<string>()

      // Try querying by subcategory_id first
      if (validUUIDs.length > 0) {
        console.log('Attempting query by subcategory_id...')
        const { data, error } = await supabase
          .from('questions')
          .select('subcategory_id')
          .in('subcategory_id', validUUIDs)

        if (error) {
          console.error('Error checking questions by subcategory_id:', error)
          console.error('Error details:', JSON.stringify(error))
          questionsError = error
        } else {
          questionsData = data || []
          console.log(`Found ${questionsData.length} questions by subcategory_id`)
          
          // Count questions per subcategory
          const questionCounts: Record<string, number> = {}
          questionsData.forEach((q: any) => {
            if (q.subcategory_id) {
              topicsWithQuestions.add(q.subcategory_id)
              questionCounts[q.subcategory_id] = (questionCounts[q.subcategory_id] || 0) + 1
            }
          })
          console.log('Questions per subcategory:', questionCounts)
        }
      }

      // If no questions found by subcategory_id, try fallback to subcategory_slug
      if (topicsWithQuestions.size === 0 && selectedIds.length > 0) {
        console.log('No questions found by subcategory_id, trying fallback to subcategory_slug...')
        
        // Fetch subcategory slugs for the selected IDs
        const { data: subcategoriesData, error: subcatError } = await supabase
          .from('subcategories')
          .select('id, slug, name')
          .in('id', selectedIds)

        if (subcatError) {
          console.error('Error fetching subcategories:', subcatError)
        } else if (subcategoriesData && subcategoriesData.length > 0) {
          const slugs = subcategoriesData.map(s => s.slug)
          console.log('Found subcategory slugs:', slugs)

          // Try querying by joining with subcategories table
          const { data: questionsBySlug, error: slugError } = await supabase
            .from('questions')
            .select('subcategory_id, subcategory:subcategories(id, slug)')
            .in('subcategory.slug', slugs)

          if (slugError) {
            console.error('Error checking questions by subcategory_slug:', slugError)
            console.error('Slug error details:', JSON.stringify(slugError))
          } else if (questionsBySlug && questionsBySlug.length > 0) {
            console.log(`Found ${questionsBySlug.length} questions by subcategory_slug`)
            questionsBySlug.forEach((q: any) => {
              if (q.subcategory_id) {
                topicsWithQuestions.add(q.subcategory_id)
              }
            })
          }
        }
      }

      // Find which topics don't have questions
      const topicsWithoutQuestions: string[] = []
      
      // Check each selected topic
      selectedIds.forEach((topicId) => {
        if (!topicsWithQuestions.has(topicId)) {
          const topic = subcategories.find(s => s.id === topicId)
          if (topic) {
            topicsWithoutQuestions.push(topic.name)
          }
        }
      })

      console.log(`Found questions for ${topicsWithQuestions.size} out of ${selectedIds.length} subcategories`)
      console.log('Topics with questions:', Array.from(topicsWithQuestions))
      console.log('Topics without questions:', topicsWithoutQuestions)

      // Determine final selected topics
      let finalSelectedIds: string[] = []

      if (topicsWithQuestions.size === 0) {
        // No topics have questions
        console.error('=== NO QUESTIONS FOUND FOR ANY TOPIC ===')
        console.error('Selected subcategories:', selectedIds)
        console.error('Valid UUIDs:', validUUIDs)
        console.error('Questions found:', questionsData.length)
        console.error('Query error:', questionsError)
        
        const errorMessage = questionsError 
          ? `Error checking questions: ${questionsError.message || JSON.stringify(questionsError)}`
          : 'None of the selected topics have questions available. Please select different topics.'
        
        toast.error(errorMessage)
        setStarting(false)
        return
      } else if (topicsWithoutQuestions.length > 0 && topicsWithQuestions.size > 0) {
        // Some topics don't have questions, show confirmation dialog
        setTopicsWithoutQuestions(topicsWithoutQuestions)
        setValidTopicIds(Array.from(topicsWithQuestions))
        setShowTopicWarning(true)
        setStarting(false)
        return
      } else {
        // All topics have questions
        finalSelectedIds = Array.from(selectedSubcategories)
      }

      // Continue with practice session creation
      await createPracticeSession(finalSelectedIds)
    } catch (error: any) {
      console.error('=== Error Starting Practice ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Error details:', JSON.stringify(error))
      
      const errorMessage = error.message || 'Failed to start practice session'
      toast.error(errorMessage)
      setStarting(false)
    }
  }

  const createPracticeSession = async (finalSelectedIds: string[]) => {
    try {
      setStarting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          total_questions: 0, // Will be updated as questions are answered
          correct_answers: 0,
          config: {
            selected_subcategories: finalSelectedIds,
            mode: 'adaptive',
            topics_without_questions: topicsWithoutQuestions.length > 0 ? topicsWithoutQuestions : undefined,
          },
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Navigate to practice interface with category ID, selected topics, and question count
      const selectedIdsString = finalSelectedIds.join(',')
      router.push(`/practice/adaptive/${categoryId}?sessionId=${session.id}&topics=${selectedIdsString}&questionCount=${questionCount}`)
      router.refresh() // Refresh to ensure the page loads properly
    } catch (error: any) {
      console.error('=== Error Creating Practice Session ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Error details:', JSON.stringify(error))
      console.error('Final selected IDs:', finalSelectedIds)
      
      const errorMessage = error.message || 'Failed to start practice session'
      toast.error(errorMessage)
      setStarting(false)
    }
  }

  const handleProceedWithValidTopics = async () => {
    setShowTopicWarning(false)
    await createPracticeSession(validTopicIds)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-4 sm:px-5 md:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/practice" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">Back to Practice</span>
          </Link>
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-2.5 font-sans">
                Configure Practice Session
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-sans">
                {category?.name || 'Loading...'} - Select topics you want to practice
              </p>
            </div>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl mb-2 font-sans">Select Topics</CardTitle>
                <CardDescription className="text-sm sm:text-base font-sans">
                  Choose the topics you want to practice. The adaptive algorithm will adjust difficulty based on your performance.
                </CardDescription>
              </div>
              {subcategories.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="shrink-0"
                >
                  {selectedSubcategories.size === subcategories.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm sm:text-base font-sans">
                  No topics available for this category yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {subcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className={`flex items-center p-4 sm:p-5 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSubcategories.has(subcategory.id)
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => handleToggleSubcategory(subcategory.id)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedSubcategories.has(subcategory.id)}
                        onCheckedChange={() => handleToggleSubcategory(subcategory.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Label className="text-base sm:text-lg font-semibold text-foreground cursor-pointer font-sans block">
                          {subcategory.name}
                        </Label>
                        {subcategory.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans line-clamp-2">
                            {subcategory.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Question Count Selector */}
            <div className="mt-6 sm:mt-8 pt-6 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <Label htmlFor="questionCount" className="text-sm sm:text-base font-semibold text-foreground font-sans">
                  Number of Questions:
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="questionCount"
                    type="number"
                    min="1"
                    max="100"
                    value={questionCountInput}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow empty input and any digits while typing
                      setQuestionCountInput(value)
                      
                      // Update the actual count if valid
                      if (value === '') {
                        // Don't update questionCount yet, wait for blur
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                        setQuestionCount(numValue)
                      }
                    }}
                    onBlur={(e) => {
                      // Validate and clamp on blur (when user finishes editing)
                      const value = e.target.value
                      const numValue = parseInt(value)
                      
                      if (value === '' || isNaN(numValue) || numValue < 1) {
                        // Reset to default if invalid or empty
                        setQuestionCount(30)
                        setQuestionCountInput('30')
                      } else if (numValue > 100) {
                        // Clamp to max
                        setQuestionCount(100)
                        setQuestionCountInput('100')
                      } else {
                        // Use valid value
                        setQuestionCount(numValue)
                        setQuestionCountInput(numValue.toString())
                      }
                    }}
                    onFocus={(e) => {
                      // Select all text when focused for easy editing
                      e.target.select()
                    }}
                    className="w-24 font-sans"
                  />
                  <span className="text-sm text-muted-foreground font-sans">
                    (Default: 30)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
              <div className="text-sm sm:text-base text-muted-foreground font-sans">
                {selectedSubcategories.size === 0 ? (
                  <span className="text-destructive font-medium">Select at least one topic to continue</span>
                ) : (
                  <span className="font-medium">
                    {selectedSubcategories.size} topic{selectedSubcategories.size !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleStartPractice}
                disabled={selectedSubcategories.size === 0 || starting || loading}
                className="w-full sm:w-auto min-w-[180px] font-sans"
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

      {/* Topic Warning Dialog */}
      <Dialog open={showTopicWarning} onOpenChange={setShowTopicWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Some Topics Don't Have Questions
            </DialogTitle>
            <DialogDescription className="pt-2">
              The following topics don't have questions available in the database:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              {topicsWithoutQuestions.map((topic, index) => (
                <li key={index} className="font-medium">{topic}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-foreground">
              Would you like to proceed with the topics that have questions available?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowTopicWarning(false)
                setStarting(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleProceedWithValidTopics}>
              Proceed with Available Topics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

