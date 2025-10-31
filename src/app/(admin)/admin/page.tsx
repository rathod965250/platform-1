import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Users, FileText, HelpCircle, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your aptitude platform',
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch statistics
  const [
    { count: usersCount },
    { count: testsCount },
    { count: questionsCount },
    { count: attemptsCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tests').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('test_attempts').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      name: 'Total Users',
      value: usersCount || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Total Tests',
      value: testsCount || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Total Questions',
      value: questionsCount || 0,
      icon: HelpCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Total Attempts',
      value: attemptsCount || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage tests, questions, and users
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/tests/new"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create Test</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new test
              </p>
            </div>
          </a>
          <a
            href="/admin/questions/new"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Add Question</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a question
              </p>
            </div>
          </a>
          <a
            href="/admin/categories"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Categories</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage categories
              </p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  )
}

