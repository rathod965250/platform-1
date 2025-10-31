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
import { useState, useEffect } from 'react'
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

// Question schema
const questionSchema = z.object({
  test_id: z.string().uuid('Please select a test').optional().nullable(),
  subcategory_id: z.string().uuid('Please select a subcategory'),
  question_type: z.enum(['mcq', 'true_false', 'fill_blank']),
  question_text: z.string().min(10, 'Question must be at least 10 characters'),
  options: questionOptionsSchema, // Properly typed validation
  correct_answer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
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
    defaultValues: initialData || {
      marks: 1,
      difficulty: 'medium',
      question_type: 'mcq',
      test_id: initialTestId || null,
    },
  })

  const questionType = watch('question_type')
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', ''])

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true)
    try {
      // Prepare options based on question type
      let options: any = {}
      
      if (data.question_type === 'mcq') {
        const filteredOptions = mcqOptions.filter(opt => opt.trim() !== '')
        if (filteredOptions.length < 2) {
          toast.error('Please provide at least 2 options for MCQ')
          setIsSubmitting(false)
          return
        }
        options = { options: filteredOptions }
      } else if (data.question_type === 'true_false') {
        options = { options: ['True', 'False'] }
      } else if (data.question_type === 'fill_blank') {
        options = { acceptableAnswers: [data.correct_answer] }
      }

      const questionData = {
        ...data,
        options,
        test_id: data.test_id || null,
      }

      if (initialData?.id) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', initialData.id)

        if (error) throw error
        toast.success('Question updated successfully')
      } else {
        // Create new question
        const { error } = await supabase
          .from('questions')
          .insert([questionData])

        if (error) throw error
        toast.success('Question created successfully')
      }

      router.push('/admin/questions')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving question:', error)
      toast.error(error.message || 'Failed to save question')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get subcategories for selected category
  const subcategories = categories.find(cat => cat.id === selectedCategory)?.subcategories || []

  // Load options if editing MCQ
  useEffect(() => {
    if (initialData?.options && typeof initialData.options === 'object' && 'options' in initialData.options) {
      setMcqOptions(initialData.options.options)
    }
  }, [initialData])

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
              onValueChange={(value) => setValue('test_id', value === 'none' ? null : value)}
              defaultValue={initialData?.test_id || initialTestId || 'none'}
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
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  setValue('subcategory_id', '') // Reset subcategory
                }}
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
                onValueChange={(value) => setValue('subcategory_id', value)}
                defaultValue={initialData?.subcategory_id}
                disabled={!selectedCategory && !initialData?.subcategory_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
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
            {mcqOptions.length < 6 && (
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

