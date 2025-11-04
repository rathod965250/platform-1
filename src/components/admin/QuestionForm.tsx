'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useState, useEffect, useMemo } from 'react'
import { X, Plus } from 'lucide-react'

// Question options schema based on question type
const questionOptionsSchema = z.union([
  // MCQ format: { options: string[], correct_answer: string, explanation?: string }
  z.object({
    options: z.array(z.string().min(1)).min(2, 'At least 2 options required').max(10, 'Maximum 10 options allowed'),
    correct_answer: z.string().min(1, 'Correct answer is required'),
    explanation: z.string().optional(),
  }),
  // True/False format: { A: string, B: string, correct_answer: 'A' | 'B', explanation?: string }
  z.object({
    A: z.string().min(1, 'Option A is required'),
    B: z.string().min(1, 'Option B is required'),
    C: z.string().optional(),
    D: z.string().optional(),
    correct_answer: z.string().min(1, 'Correct answer is required'),
    explanation: z.string().optional(),
  }),
  // Fill in blank format: { correct_answer: string, explanation?: string }
  z.object({
    correct_answer: z.string().min(1, 'Correct answer is required'),
    explanation: z.string().optional(),
  }),
])

// Question schema - options validation is handled manually in onSubmit
const questionSchema = z.object({
  test_id: z.string().uuid('Please select a test').optional().nullable(),
  subcategory_id: z.string().uuid('Please select a subcategory'),
  question_type: z.enum(['mcq', 'true_false', 'fill_blank']),
  question_text: z.string().min(10, 'Question must be at least 10 characters'),
  options: z.any().optional(), // Options are validated manually in onSubmit
  correct_answer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
  solution_steps: z.string().optional(), // Step-by-step solution
  hints: z.string().optional(), // Hints for solving
  formula_used: z.string().optional(), // Formulas or equations used
  marks: z.number().min(1, 'Marks must be at least 1'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

type QuestionFormData = z.infer<typeof questionSchema>

interface QuestionFormProps {
  tests: Array<{ id: string; title: string; slug: string }>
  categories: Array<{ 
    id: string
    name: string
    slug: string
    subcategories: Array<{ id: string; name: string; slug: string }>
  }>
  initialData?: Partial<QuestionFormData> & { id?: string }
  initialTestId?: string
}

export function QuestionForm({ tests, categories, initialData, initialTestId }: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: initialData ? {
      ...initialData,
      solution_steps: (initialData as any).solution_steps || '',
      hints: (initialData as any).hints || '',
      formula_used: (initialData as any).formula_used || '',
    } : {
      marks: 1,
      difficulty: 'medium',
      question_type: 'mcq',
      test_id: initialTestId || null,
      solution_steps: '',
      hints: '',
      formula_used: '',
    },
  })

  const questionType = watch('question_type')
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '', '']) // Support up to 5 options (A, B, C, D, E)

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true)
    try {
      console.log('[QuestionForm] Form submitted with data:', data)
      
      // Validate required fields
      if (!data.subcategory_id) {
        toast.error('Please select a subcategory')
        setIsSubmitting(false)
        return
      }
      
      if (!data.question_text || data.question_text.trim().length < 10) {
        toast.error('Question text must be at least 10 characters')
        setIsSubmitting(false)
        return
      }
      
      if (!data.explanation || data.explanation.trim().length < 10) {
        toast.error('Explanation must be at least 10 characters')
        setIsSubmitting(false)
        return
      }
      
      if (!data.correct_answer || data.correct_answer.trim().length === 0) {
        toast.error('Please provide a correct answer')
        setIsSubmitting(false)
        return
      }

      // Prepare options based on question type
      let options: any = {}
      
      if (data.question_type === 'mcq') {
        const filteredOptions = mcqOptions.filter(opt => opt.trim() !== '')
        if (filteredOptions.length < 2) {
          toast.error('Please provide at least 2 options for MCQ')
          setIsSubmitting(false)
          return
        }
        // Ensure correct answer is in the options
        if (!filteredOptions.includes(data.correct_answer)) {
          toast.error('Correct answer must match one of the options')
          setIsSubmitting(false)
          return
        }
        // For backward compatibility, keep options JSONB
        options = { options: filteredOptions }
      } else if (data.question_type === 'true_false') {
        options = { options: ['True', 'False'] }
        // Ensure correct answer is 'True' or 'False'
        if (!['True', 'False'].includes(data.correct_answer)) {
          toast.error('Correct answer must be "True" or "False"')
          setIsSubmitting(false)
          return
        }
      } else if (data.question_type === 'fill_blank') {
        options = { acceptableAnswers: [data.correct_answer] }
      }

      // Prepare question data matching database schema
      // Column order: question_text, question_type, difficulty, 
      // option_a, option_b, option_c, option_d, option_e,
      // correct_answer, explanation, solution_steps, hints,
      // formula_used, marks
      const questionData: any = {
        subcategory_id: data.subcategory_id,
        question_type: data.question_type,
        question_text: data.question_text,
        difficulty: data.difficulty,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        solution_steps: data.solution_steps || null,
        hints: data.hints || null,
        formula_used: data.formula_used || null,
        marks: data.marks,
        order: 0, // Default order
      }

      // For MCQ questions, store options in individual columns
      if (data.question_type === 'mcq') {
        const filteredOptions = mcqOptions.filter(opt => opt.trim() !== '')
        questionData.option_a = filteredOptions[0] || null
        questionData.option_b = filteredOptions[1] || null
        questionData.option_c = filteredOptions[2] || null
        questionData.option_d = filteredOptions[3] || null
        questionData.option_e = filteredOptions[4] || null
        // Keep options JSONB for backward compatibility
        questionData.options = options
      } else {
        // For other question types, use options JSONB
        questionData.options = options
      }

      // Only include test_id if it's provided and not 'none' (it's optional)
      if (data.test_id && data.test_id !== 'none' && data.test_id !== null) {
        questionData.test_id = data.test_id
      } else {
        // Explicitly set to null if not provided
        questionData.test_id = null
      }

      console.log('[QuestionForm] Prepared question data:', questionData)
      
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('[QuestionForm] Authentication error:', authError)
        toast.error('You must be logged in to create questions')
        setIsSubmitting(false)
        return
      }
      
      console.log('[QuestionForm] User authenticated:', user.id)

      if (initialData?.id) {
        // Update existing question
        console.log('[QuestionForm] Updating question:', initialData.id)
        const { data: updatedData, error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', initialData.id)
          .select()

        if (error) {
          console.error('[QuestionForm] Error updating question:', error)
          console.error('[QuestionForm] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
        console.log('[QuestionForm] Question updated successfully:', updatedData)
        toast.success('Question updated successfully')
      } else {
        // Create new question
        console.log('[QuestionForm] Creating new question')
        const { data: insertedData, error } = await supabase
          .from('questions')
          .insert([questionData])
          .select()

        if (error) {
          console.error('[QuestionForm] Error creating question:', error)
          console.error('[QuestionForm] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
        console.log('[QuestionForm] Question created successfully:', insertedData)
        toast.success('Question created successfully')
      }

      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/admin/questions')
      router.refresh()
    } catch (error: any) {
      console.error('[QuestionForm] Error saving question:', error)
      console.error('[QuestionForm] Full error object:', JSON.stringify(error, null, 2))
      
      // Extract detailed error message
      let errorMessage = 'Failed to save question'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Handle specific Supabase error codes
      if (error?.code === 'PGRST116') {
        errorMessage = 'Question not found'
      } else if (error?.code === '42501') {
        errorMessage = 'Permission denied. You must be an admin to create questions.'
      } else if (error?.code === '23505') {
        errorMessage = 'A question with these details already exists'
      } else if (error?.code === '23503') {
        errorMessage = 'Invalid subcategory or test reference'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get subcategories for selected category - memoize to prevent recreating array
  const subcategories = useMemo(() => {
    return categories.find(cat => cat.id === selectedCategory)?.subcategories || []
  }, [categories, selectedCategory])

  // Load initial data when editing - use stable dependencies
  useEffect(() => {
    if (!initialData) return

    // Set category if subcategory is provided
    if (initialData.subcategory_id) {
      const category = categories.find(cat => 
        cat.subcategories.some(sub => sub.id === initialData.subcategory_id)
      )
      if (category && category.id !== selectedCategory) {
        setSelectedCategory(category.id)
      }
    }
    
    // Load MCQ options if editing
    // First try to load from individual columns (new format)
    if (initialData && (initialData as any).option_a) {
      const optionsArray: string[] = []
      if ((initialData as any).option_a) optionsArray.push((initialData as any).option_a)
      if ((initialData as any).option_b) optionsArray.push((initialData as any).option_b)
      if ((initialData as any).option_c) optionsArray.push((initialData as any).option_c)
      if ((initialData as any).option_d) optionsArray.push((initialData as any).option_d)
      if ((initialData as any).option_e) optionsArray.push((initialData as any).option_e)
      // Pad to minimum 4 options for UI (but keep existing if less than 4)
      while (optionsArray.length < 4) {
        optionsArray.push('')
      }
      setMcqOptions(optionsArray)
    } else if (initialData?.options && typeof initialData.options === 'object' && 'options' in initialData.options) {
      // Fallback to old JSONB format for backward compatibility
      const optionsArray = (initialData.options as any).options
      if (Array.isArray(optionsArray) && optionsArray.length > 0) {
        // Pad to minimum 4 options for UI (but keep existing if less than 4)
        while (optionsArray.length < 4) {
          optionsArray.push('')
        }
        setMcqOptions(optionsArray)
      }
    }
    // Only depend on stable primitive values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, initialData?.subcategory_id])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Question Details
        </h2>

        <div className="space-y-4">
          {/* Test */}
          <div>
            <Label htmlFor="test_id">Test (Optional)</Label>
            <Select
              onValueChange={(value) => {
                const testId = value === 'none' ? null : value
                setValue('test_id', testId, { shouldValidate: true })
              }}
              defaultValue={initialData?.test_id || initialTestId || 'none'}
              value={watch('test_id') || 'none'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific test</SelectItem>
                {tests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to make question available for all tests
            </p>
            {errors.test_id && (
              <p className="mt-1 text-sm text-red-600">{errors.test_id.message}</p>
            )}
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  setValue('subcategory_id', '', { shouldValidate: true }) // Reset subcategory
                }}
                value={selectedCategory || (initialData?.subcategory_id ? 
                  categories.find(cat => 
                    cat.subcategories.some(sub => sub.id === initialData.subcategory_id)
                  )?.id || undefined : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory_id">Subcategory *</Label>
              <Select
                onValueChange={(value) => {
                  setValue('subcategory_id', value, { shouldValidate: true })
                }}
                value={watch('subcategory_id') || undefined}
                disabled={!selectedCategory && !initialData?.subcategory_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.length > 0 ? (
                    subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Select a category first
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.subcategory_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subcategory_id.message}</p>
              )}
            </div>
          </div>

          {/* Question Type, Difficulty, Marks */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="question_type">Question Type *</Label>
              <Select
                onValueChange={(value: any) => setValue('question_type', value)}
                defaultValue={initialData?.question_type || 'mcq'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                onValueChange={(value: any) => setValue('difficulty', value)}
                defaultValue={initialData?.difficulty || 'medium'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marks">Marks *</Label>
              <Input
                id="marks"
                type="number"
                {...register('marks', { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.marks && (
                <p className="mt-1 text-sm text-red-600">{errors.marks.message}</p>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <Label htmlFor="question_text">Question *</Label>
            <Textarea
              id="question_text"
              {...register('question_text')}
              placeholder="Enter your question here..."
              rows={4}
            />
            {errors.question_text && (
              <p className="mt-1 text-sm text-red-600">{errors.question_text.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Supports LaTeX for mathematical expressions (e.g., $x^2 + y^2 = z^2$)
            </p>
          </div>
        </div>
      </Card>

      {/* Options based on question type */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Answer Options
        </h2>

        {questionType === 'mcq' && (
          <div className="space-y-3">
            {mcqOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...mcqOptions]
                    newOptions[index] = e.target.value
                    setMcqOptions(newOptions)
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                {index > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setMcqOptions(mcqOptions.filter((_, i) => i !== index))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {mcqOptions.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMcqOptions([...mcqOptions, ''])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {questionType === 'true_false' && (
          <div className="text-gray-600 dark:text-gray-400">
            Options: True / False
          </div>
        )}

        {questionType === 'fill_blank' && (
          <div className="text-gray-600 dark:text-gray-400">
            Students will type their answer. Provide the correct answer below.
          </div>
        )}

        {/* Correct Answer */}
        <div className="mt-4">
          <Label htmlFor="correct_answer">Correct Answer *</Label>
          {questionType === 'mcq' && (
            <Select
              onValueChange={(value) => setValue('correct_answer', value)}
              defaultValue={initialData?.correct_answer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select correct option" />
              </SelectTrigger>
              <SelectContent>
                {mcqOptions
                  .filter(opt => opt.trim() !== '')
                  .map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {String.fromCharCode(65 + index)}: {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {questionType === 'true_false' && (
            <Select
              onValueChange={(value) => setValue('correct_answer', value)}
              defaultValue={initialData?.correct_answer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="True">True</SelectItem>
                <SelectItem value="False">False</SelectItem>
              </SelectContent>
            </Select>
          )}
          {questionType === 'fill_blank' && (
            <Input
              id="correct_answer"
              {...register('correct_answer')}
              placeholder="Type the correct answer"
            />
          )}
          {errors.correct_answer && (
            <p className="mt-1 text-sm text-red-600">{errors.correct_answer.message}</p>
          )}
        </div>
      </Card>

      {/* Explanation */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Explanation
        </h2>

        <div>
          <Label htmlFor="explanation">Detailed Explanation *</Label>
          <Textarea
            id="explanation"
            {...register('explanation')}
            placeholder="Provide a detailed explanation of the answer..."
            rows={5}
          />
          {errors.explanation && (
            <p className="mt-1 text-sm text-red-600">{errors.explanation.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Help students understand why the answer is correct
          </p>
        </div>
      </Card>

      {/* Solution Steps */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Solution Steps
        </h2>

        <div>
          <Label htmlFor="solution_steps">Step-by-Step Solution</Label>
          <Textarea
            id="solution_steps"
            {...register('solution_steps')}
            placeholder="Provide step-by-step solution or breakdown for the question..."
            rows={6}
          />
          {errors.solution_steps && (
            <p className="mt-1 text-sm text-red-600">{errors.solution_steps.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Break down the solution into clear, sequential steps
          </p>
        </div>
      </Card>

      {/* Hints */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Hints
        </h2>

        <div>
          <Label htmlFor="hints">Hints for Solving</Label>
          <Textarea
            id="hints"
            {...register('hints')}
            placeholder="Provide hints or clues to help solve the question..."
            rows={4}
          />
          {errors.hints && (
            <p className="mt-1 text-sm text-red-600">{errors.hints.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Give students helpful clues without giving away the answer
          </p>
        </div>
      </Card>

      {/* Formula Used */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Formula Used
        </h2>

        <div>
          <Label htmlFor="formula_used">Formulas or Equations</Label>
          <Input
            id="formula_used"
            {...register('formula_used')}
            placeholder="e.g., E=mc², F=ma, a²+b²=c²"
          />
          {errors.formula_used && (
            <p className="mt-1 text-sm text-red-600">{errors.formula_used.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            List any formulas or equations relevant to solving this question
          </p>
        </div>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update Question' : 'Create Question'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

