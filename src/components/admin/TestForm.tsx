'use client'

import { useForm } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useState } from 'react'

const testSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  category_id: z.string().uuid('Please select a category'),
  test_type: z.enum(['practice', 'mock', 'company_specific']),
  company_name: z.string().optional(),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
  total_marks: z.number().min(0, 'Total marks must be 0 or greater'),
  negative_marking: z.boolean(),
  is_published: z.boolean(),
})

type TestFormData = z.infer<typeof testSchema>

interface TestFormProps {
  categories: Array<{ id: string; name: string; slug: string }>
  initialData?: Partial<TestFormData> & { id?: string }
}

export function TestForm({ categories, initialData }: TestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: initialData || {
      negative_marking: false,
      is_published: false,
      total_marks: 0,
      duration_minutes: 60,
      test_type: 'mock',
    },
  })

  const testType = watch('test_type')
  const title = watch('title')

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const onSubmit = async (data: TestFormData) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Remove company_name if not company_specific
      const testData = {
        ...data,
        company_name: data.test_type === 'company_specific' ? data.company_name : null,
        created_by: user.id,
      }

      if (initialData?.id) {
        // Update existing test
        const { error } = await supabase
          .from('tests')
          .update(testData)
          .eq('id', initialData.id)

        if (error) throw error
        toast.success('Test updated successfully')
      } else {
        // Create new test
        const { error } = await supabase
          .from('tests')
          .insert([testData])

        if (error) throw error
        toast.success('Test created successfully')
      }

      router.push('/admin/tests')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving test:', error)
      toast.error(error.message || 'Failed to save test')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Information
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Test Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., TCS Mock Test 2024"
              onBlur={() => {
                if (!initialData?.slug) {
                  setValue('slug', generateSlug(title || ''))
                }
              }}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="e.g., tcs-mock-test-2024"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the test..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Configuration
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Category */}
          <div>
            <Label htmlFor="category_id">Category *</Label>
            <Select
              onValueChange={(value) => setValue('category_id', value)}
              defaultValue={initialData?.category_id}
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
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
            )}
          </div>

          {/* Test Type */}
          <div>
            <Label htmlFor="test_type">Test Type *</Label>
            <Select
              onValueChange={(value: any) => setValue('test_type', value)}
              defaultValue={initialData?.test_type || 'mock'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="mock">Mock Test</SelectItem>
                <SelectItem value="company_specific">Company Specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company Name (only for company_specific) */}
          {testType === 'company_specific' && (
            <div className="sm:col-span-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                placeholder="e.g., TCS, Infosys, Wipro"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
            <Input
              id="duration_minutes"
              type="number"
              {...register('duration_minutes', { valueAsNumber: true })}
              placeholder="60"
            />
            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
            )}
          </div>

          {/* Total Marks */}
          <div>
            <Label htmlFor="total_marks">Total Marks *</Label>
            <Input
              id="total_marks"
              type="number"
              {...register('total_marks', { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.total_marks && (
              <p className="mt-1 text-sm text-red-600">{errors.total_marks.message}</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Settings
        </h2>

        <div className="space-y-4">
          {/* Negative Marking */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="negative_marking">Negative Marking</Label>
              <p className="text-sm text-gray-500">
                Deduct marks for incorrect answers
              </p>
            </div>
            <Switch
              id="negative_marking"
              onCheckedChange={(checked) => setValue('negative_marking', checked)}
              defaultChecked={initialData?.negative_marking}
            />
          </div>

          {/* Published */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_published">Publish Test</Label>
              <p className="text-sm text-gray-500">
                Make this test available to students
              </p>
            </div>
            <Switch
              id="is_published"
              onCheckedChange={(checked) => setValue('is_published', checked)}
              defaultChecked={initialData?.is_published}
            />
          </div>
        </div>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update Test' : 'Create Test'}
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

