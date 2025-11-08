'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Clock,
  Hash
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Subcategory {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  subcategories: Subcategory[]
}

interface MockTestBuilderProps {
  categories: Category[]
  userId: string
}

export function MockTestBuilder({ categories, userId }: MockTestBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State management
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set())
  const [difficultyLevel, setDifficultyLevel] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableQuestions, setAvailableQuestions] = useState<number>(0)
  
  // Custom test configuration
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(60)
  const [customHours, setCustomHours] = useState<number>(1)
  const [customMinutes, setCustomMinutes] = useState<number>(30)
  const [isTimeManuallySet, setIsTimeManuallySet] = useState(false)

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Toggle subcategory selection
  const toggleSubcategory = (subcategoryId: string) => {
    const newSelected = new Set(selectedSubcategories)
    if (newSelected.has(subcategoryId)) {
      newSelected.delete(subcategoryId)
    } else {
      newSelected.add(subcategoryId)
    }
    setSelectedSubcategories(newSelected)
    updateAvailableQuestions(newSelected, difficultyLevel)
  }

  // Select all subcategories in a category
  const selectAllInCategory = (category: Category) => {
    const newSelected = new Set(selectedSubcategories)
    const allSelected = category.subcategories.every(sub => newSelected.has(sub.id))
    
    if (allSelected) {
      // Deselect all
      category.subcategories.forEach(sub => newSelected.delete(sub.id))
    } else {
      // Select all
      category.subcategories.forEach(sub => newSelected.add(sub.id))
    }
    
    setSelectedSubcategories(newSelected)
    updateAvailableQuestions(newSelected, difficultyLevel)
  }

  // Update available questions count
  const updateAvailableQuestions = async (subcategories: Set<string>, difficulty: string) => {
    if (subcategories.size === 0) {
      setAvailableQuestions(0)
      return
    }

    try {
      let query = supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .in('subcategory_id', Array.from(subcategories))

      if (difficulty !== 'all') {
        query = query.eq('difficulty', difficulty)
      }

      const { count } = await query
      setAvailableQuestions(count || 0)
    } catch (err) {
      console.error('Error fetching question count:', err)
    }
  }

  // Handle difficulty change
  const handleDifficultyChange = (value: string) => {
    const newDifficulty = value as 'all' | 'easy' | 'medium' | 'hard'
    setDifficultyLevel(newDifficulty)
    updateAvailableQuestions(selectedSubcategories, newDifficulty)
  }

  // Handle question count change
  const handleQuestionCountChange = (value: string) => {
    const count = parseInt(value) || 0
    setCustomQuestionCount(count)
    
    // Auto-calculate time if not manually set (1.5 min per question)
    if (!isTimeManuallySet && count > 0) {
      const totalMinutes = Math.ceil(count * 1.5)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      setCustomHours(hours)
      setCustomMinutes(minutes)
    }
  }

  // Handle time change
  const handleTimeChange = (hours: string, minutes: string) => {
    // Handle empty string - keep as 0 but allow empty input
    const h = hours === '' ? 0 : parseInt(hours) || 0
    const m = minutes === '' ? 0 : parseInt(minutes) || 0
    setCustomHours(h)
    setCustomMinutes(m)
    setIsTimeManuallySet(true)
  }
  
  // Handle hours input change
  const handleHoursInput = (value: string) => {
    if (value === '') {
      setCustomHours(0)
      setIsTimeManuallySet(true)
      return
    }
    
    // Parse and clamp the value
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      setCustomHours(0)
    } else {
      const clamped = Math.min(Math.max(num, 0), 5)
      setCustomHours(clamped)
    }
    setIsTimeManuallySet(true)
  }
  
  // Handle minutes input change
  const handleMinutesInput = (value: string) => {
    if (value === '') {
      setCustomMinutes(0)
      setIsTimeManuallySet(true)
      return
    }
    
    // Parse and clamp the value
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      setCustomMinutes(0)
    } else {
      const clamped = Math.min(Math.max(num, 0), 59)
      setCustomMinutes(clamped)
    }
    setIsTimeManuallySet(true)
  }

  // Generate mock test
  const generateMockTest = async () => {
    if (selectedSubcategories.size === 0) {
      setError('Please select at least one subcategory')
      return
    }

    if (availableQuestions === 0) {
      setError('No questions available for the selected criteria')
      return
    }

    setIsGenerating(true)
    setError(null)
    
    const startTime = Date.now()

    try {
      // Fetch questions based on selection
      let query = supabase
        .from('questions')
        .select('*')
        .in('subcategory_id', Array.from(selectedSubcategories))

      if (difficultyLevel !== 'all') {
        query = query.eq('difficulty', difficultyLevel)
      }

      const { data: questions, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (!questions || questions.length === 0) {
        setError('No questions found for the selected criteria')
        setIsGenerating(false)
        return
      }

      // Smart question distribution algorithm
      // Group questions by subcategory
      const questionsBySubcategory = questions.reduce((acc: any, question: any) => {
        const subId = question.subcategory_id
        if (!acc[subId]) acc[subId] = []
        acc[subId].push(question)
        return acc
      }, {})

      // Calculate proportional distribution
      const subcategoryIds = Object.keys(questionsBySubcategory)
      const totalQuestions = questions.length
      const targetQuestionsPerTopic = Math.ceil(totalQuestions / subcategoryIds.length)

      // Distribute questions evenly across topics
      const distributedQuestions: any[] = []
      
      // First pass: Get equal number from each topic
      subcategoryIds.forEach(subId => {
        const topicQuestions = questionsBySubcategory[subId]
        const questionsToTake = Math.min(targetQuestionsPerTopic, topicQuestions.length)
        
        // Shuffle within topic for variety
        const shuffled = topicQuestions.sort(() => Math.random() - 0.5)
        distributedQuestions.push(...shuffled.slice(0, questionsToTake))
      })

      // Second pass: Fill remaining slots if some topics had fewer questions
      if (distributedQuestions.length < totalQuestions) {
        const remaining = questions.filter(
          (q: any) => !distributedQuestions.find((dq: any) => dq.id === q.id)
        )
        distributedQuestions.push(...remaining)
      }

      // Final shuffle to mix topics
      const finalQuestions = distributedQuestions.sort(() => Math.random() - 0.5)

      // Limit questions to custom count
      const selectedQuestions = finalQuestions.slice(0, customQuestionCount)
      
      // Calculate total duration in minutes
      const totalDurationMinutes = (customHours * 60) + customMinutes
      
      // Calculate generation time
      const generationTime = Date.now() - startTime
      
      // Get selected categories from subcategories
      const selectedCategoryIds = Array.from(
        new Set(
          Array.from(selectedSubcategories).map(subId => {
            const category = categories.find(cat => 
              cat.subcategories.some(sub => sub.id === subId)
            )
            return category?.id
          }).filter(Boolean)
        )
      )
      
      // Calculate questions per topic distribution
      const questionsPerTopic: Record<string, number> = {}
      selectedQuestions.forEach((q: any) => {
        const subId = q.subcategory_id
        questionsPerTopic[subId] = (questionsPerTopic[subId] || 0) + 1
      })

      // Create a custom mock test
      const timestamp = Date.now()
      const testSlug = `custom-mock-${userId.slice(0, 8)}-${timestamp}`
      
      const testData = {
        title: `Custom Mock Test - ${new Date().toLocaleDateString()}`,
        slug: testSlug,
        test_type: 'mock',
        duration_minutes: totalDurationMinutes,
        total_marks: selectedQuestions.length,
        is_published: true,
        created_by: userId,
        description: `Custom test with ${selectedQuestions.length} questions from ${subcategoryIds.length} topics (${difficultyLevel} difficulty)`,
      }

      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert(testData)
        .select()
        .single()

      if (testError) throw testError

      // Update questions to link them to this test
      const questionIds = selectedQuestions.map((q: any) => q.id)
      
      const { error: updateError } = await supabase
        .from('questions')
        .update({ test_id: test.id })
        .in('id', questionIds)

      if (updateError) throw updateError
      
      // Create custom mock test record for tracking
      const customTestData = {
        user_id: userId,
        test_id: test.id,
        title: testData.title,
        description: testData.description,
        selected_categories: selectedCategoryIds,
        selected_subcategories: Array.from(selectedSubcategories),
        difficulty_level: difficultyLevel,
        total_questions: selectedQuestions.length,
        duration_hours: customHours,
        duration_minutes: customMinutes,
        questions_per_topic: questionsPerTopic,
        selected_question_ids: questionIds,
        status: 'created',
        is_time_manually_set: isTimeManuallySet,
        generation_time_ms: generationTime,
        total_marks: selectedQuestions.length,
      }
      
      const { error: customTestError } = await supabase
        .from('custom_mock_tests')
        .insert(customTestData)
      
      if (customTestError) {
        console.error('Error creating custom test record:', customTestError)
        // Don't fail the whole operation, just log the error
      }

      // Redirect to test instructions
      router.push(`/test/${test.id}/instructions`)
    } catch (err: any) {
      console.error('Error generating mock test:', err)
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack
      })
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to generate mock test'
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.code === '42501') {
        errorMessage = 'Permission denied. Please ensure you have the necessary permissions.'
      } else if (err?.code === '23502') {
        errorMessage = 'Missing required field. Please try again.'
      }
      
      setError(errorMessage)
      setIsGenerating(false)
    }
  }

  // Check if category has any selected subcategories
  const isCategorySelected = (category: Category) => {
    return category.subcategories.some(sub => selectedSubcategories.has(sub.id))
  }

  // Check if all subcategories in category are selected
  const isAllSelected = (category: Category) => {
    return category.subcategories.every(sub => selectedSubcategories.has(sub.id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3">
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 shrink-0">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans tracking-tight leading-tight">
                Create Custom Mock Test
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1 sm:mt-1.5 font-sans leading-relaxed">
                Select categories, subcategories, and difficulty level to generate your personalized test
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Selection Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Difficulty Selection */}
            <Card className="border-2 border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-sans font-semibold">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  Select Difficulty Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={difficultyLevel} onValueChange={handleDifficultyChange}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="cursor-pointer text-sm sm:text-base font-sans font-medium">
                        All Levels
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy" className="cursor-pointer text-sm sm:text-base font-sans font-medium">
                        Easy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer text-sm sm:text-base font-sans font-medium">
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label htmlFor="hard" className="cursor-pointer text-sm sm:text-base font-sans font-medium">
                        Hard
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Categories and Subcategories */}
            <Card className="border-2 border-border">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-sans font-semibold">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  Select Topics
                </CardTitle>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans mt-1.5">
                  Choose categories and their subcategories for your test
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                  >
                    {/* Category Header */}
                    <div
                      className={`p-3 sm:p-4 flex items-center justify-between min-h-[56px] sm:min-h-[60px] ${
                        isCategorySelected(category)
                          ? 'bg-primary/5 border-l-4 border-l-primary'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Checkbox Area - Only for selection */}
                        <div 
                          className="flex items-center gap-2 sm:gap-3 cursor-pointer py-2 -my-2 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation()
                            selectAllInCategory(category)
                          }}
                        >
                          <Checkbox
                            checked={isAllSelected(category)}
                            onCheckedChange={() => selectAllInCategory(category)}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="shrink-0"
                            disabled={category.subcategories.length === 0}
                          />
                        </div>
                        
                        {/* Text Area - For expansion/collapse */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer py-2 -my-2 touch-manipulation"
                          onClick={() => {
                            if (category.subcategories.length > 0) {
                              toggleCategory(category.id)
                            }
                          }}
                        >
                          <h3 className="font-semibold text-foreground font-sans text-sm sm:text-base md:text-lg truncate select-none">{category.name}</h3>
                          {category.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5 line-clamp-1 select-none">
                              {category.description}
                            </p>
                          )}
                        </div>
                        
                        {category.subcategories.length > 0 && (
                          <Badge variant="secondary" className="shrink-0 text-xs sm:text-sm font-sans">
                            {category.subcategories.filter(sub => selectedSubcategories.has(sub.id)).length}/
                            {category.subcategories.length}
                          </Badge>
                        )}
                      </div>
                      {category.subcategories.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(category.id)}
                          className="shrink-0 ml-2 min-h-[44px] min-w-[44px]"
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Subcategories */}
                    {category.subcategories.length > 0 && expandedCategories.has(category.id) && (
                      <div className="p-3 sm:p-4 pt-2 bg-muted/30 space-y-1.5 sm:space-y-2">
                        {category.subcategories.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded hover:bg-background/50 transition-colors min-h-[44px] touch-manipulation"
                          >
                            <Checkbox
                              id={subcategory.id}
                              checked={selectedSubcategories.has(subcategory.id)}
                              onCheckedChange={() => toggleSubcategory(subcategory.id)}
                              className="shrink-0"
                            />
                            <Label
                              htmlFor={subcategory.id}
                              className="flex-1 cursor-pointer text-sm sm:text-base font-sans font-medium leading-snug"
                            >
                              {subcategory.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Empty State for Categories without Subcategories */}
                    {category.subcategories.length === 0 && (
                      <div className="p-3 sm:p-4 pt-2 bg-muted/20">
                        <p className="text-xs sm:text-sm text-muted-foreground font-sans text-center italic">
                          No topics available in this category
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-primary/20 lg:sticky lg:top-4">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-sans font-semibold">Test Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between items-center p-2.5 sm:p-3 bg-muted rounded-lg">
                    <span className="text-xs sm:text-sm font-medium font-sans">Difficulty</span>
                    <Badge variant="default" className="capitalize text-xs sm:text-sm font-sans">
                      {difficultyLevel}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-2.5 sm:p-3 bg-muted rounded-lg">
                    <span className="text-xs sm:text-sm font-medium font-sans">Topics Selected</span>
                    <Badge variant="secondary" className="text-xs sm:text-sm font-sans">
                      {selectedSubcategories.size}
                    </Badge>
                  </div>
                </div>

                {/* Custom Test Configuration */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <h4 className="text-sm sm:text-base font-semibold font-sans text-foreground">Test Configuration</h4>
                  
                  {/* Question Count Input */}
                  <div className="space-y-2">
                    <Label htmlFor="questionCount" className="text-xs sm:text-sm font-medium font-sans flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-primary" />
                      Number of Questions
                    </Label>
                    <input
                      id="questionCount"
                      type="number"
                      min="1"
                      max={availableQuestions || 100}
                      value={customQuestionCount}
                      onChange={(e) => handleQuestionCountChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base font-sans border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Enter number of questions"
                    />
                    {availableQuestions > 0 && customQuestionCount > availableQuestions && (
                      <p className="text-xs text-destructive font-sans">
                        Only {availableQuestions} questions available
                      </p>
                    )}
                  </div>

                  {/* Time Duration Inputs */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium font-sans flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Test Duration
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="hours" className="text-xs font-sans text-muted-foreground">Hours</Label>
                        <input
                          id="hours"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customHours}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            if (value === '') {
                              setCustomHours(0)
                            } else {
                              const num = parseInt(value, 10)
                              setCustomHours(Math.min(num, 5))
                            }
                            setIsTimeManuallySet(true)
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              setCustomHours(0)
                            }
                          }}
                          className="w-full px-3 py-2 text-sm sm:text-base font-sans border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minutes" className="text-xs font-sans text-muted-foreground">Minutes</Label>
                        <input
                          id="minutes"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={customMinutes}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            if (value === '') {
                              setCustomMinutes(0)
                            } else {
                              const num = parseInt(value, 10)
                              setCustomMinutes(Math.min(num, 59))
                            }
                            setIsTimeManuallySet(true)
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              setCustomMinutes(0)
                            }
                          }}
                          className="w-full px-3 py-2 text-sm sm:text-base font-sans border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans italic">
                      {!isTimeManuallySet && 'Auto-calculated: 1.5 min per question'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-destructive font-sans leading-snug">{error}</p>
                  </div>
                )}

                <Button
                  onClick={generateMockTest}
                  disabled={
                    isGenerating || 
                    selectedSubcategories.size === 0 || 
                    availableQuestions === 0 || 
                    customQuestionCount === 0 || 
                    customQuestionCount > availableQuestions ||
                    (customHours === 0 && customMinutes === 0)
                  }
                  className="w-full font-sans font-semibold text-sm sm:text-base min-h-[44px]"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span className="text-sm sm:text-base">Generating Test...</span>
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">Generate & Start Test</span>
                    </>
                  )}
                </Button>

                <p className="text-xs sm:text-sm text-muted-foreground text-center font-sans leading-relaxed">
                  Questions will be distributed evenly across all selected topics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
