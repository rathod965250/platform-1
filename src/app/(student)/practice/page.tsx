import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Calculator, BookOpen, BarChart3, Lightbulb } from 'lucide-react'

export const metadata = {
  title: 'Practice | Aptitude Preparation Platform',
  description: 'Practice aptitude questions by topic',
}

export default async function PracticePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(count)
    `)
    .order('order', { ascending: true })

  const topicIcons: Record<string, any> = {
    'Quantitative Aptitude': Calculator,
    'Logical Reasoning': Brain,
    'Verbal Ability': BookOpen,
    'Data Interpretation': BarChart3,
    'Problem Solving': Lightbulb,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Practice Mode</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a topic and practice at your own pace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => {
            const Icon = topicIcons[category.name] || Brain

            return (
              <Card
                key={category.id}
                className="group hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                      <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant="secondary">
                      {category.subcategories?.[0]?.count || 0} topics
                    </Badge>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {category.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Your Accuracy</span>
                      <span className="font-medium">Coming Soon</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => window.location.href = `/practice/configure/${category.id}`}
                  >
                    Start Adaptive Practice
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

