'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, Brain, BookOpen, BarChart3, Lightbulb } from 'lucide-react'
import { logError } from '@/lib/utils/error-logger'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  order: number
}

const iconMap: Record<string, any> = {
  Calculator,
  Brain,
  BookOpen,
  BarChart3,
  Lightbulb,
}

export function CategoriesTest() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('order')

        if (error) {
          setError(error.message)
        } else {
          setCategories(data || [])
        }
      } catch (err) {
        setError('Failed to fetch categories')
        logError('CategoriesTest', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-600">Error: {error}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-600">
          ✓ Database Connected
        </Badge>
        <span className="text-sm text-gray-600">
          {categories.length} categories loaded from Supabase
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Calculator
          return (
            <Card key={category.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <Icon className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">/{category.slug}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

