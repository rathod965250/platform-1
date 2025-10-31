'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Brain,
  Calculator,
  ClipboardList,
  Target,
  TrendingUp,
  Trophy,
  Flame,
  Clock,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DashboardContentProps {
  profile: any
  stats: {
    totalTests: number
    avgScore: number
    totalQuestionsAnswered: number
    currentStreak: number
  }
  recentActivity: Array<{
    type: 'test' | 'practice'
    id: string
    title: string
    date: string
    score: number
    totalMarks: number
    testId?: string
  }>
  performanceTrend: Array<{
    index: number
    score: string
    date: string
  }>
  weakAreas: string[]
  masteryLevels?: Record<string, number>
  adaptiveStates?: any[]
}

export function DashboardContent({
  profile,
  stats,
  recentActivity,
  performanceTrend,
  weakAreas,
  masteryLevels = {},
  adaptiveStates = [],
}: DashboardContentProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      if (diffInHours < 1) return 'Just now'
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getRecommendations = () => {
    const recommendations = []

    if (weakAreas.length > 0) {
      // Find category ID for the weak area
      const weakCategory = adaptiveStates?.find(
        (state: any) => state.category?.name === weakAreas[0]
      )
      const categoryId = weakCategory?.category_id || ''
      
      recommendations.push({
        title: `Practice ${weakAreas[0]}`,
        description: `Your accuracy in ${weakAreas[0]} is below 60%. Use adaptive practice to improve.`,
        action: 'Start Practice',
        href: categoryId ? `/practice/configure/${categoryId}` : '/practice',
        icon: Brain,
        color: 'text-orange-600',
      })
    }

    if (stats.totalTests < 3) {
      recommendations.push({
        title: 'Take a full-length mock test',
        description: 'Experience a real test environment and identify your weak areas.',
        action: 'Take Test',
        href: '/test',
        icon: ClipboardList,
        color: 'text-blue-600',
      })
    }

    if (recentActivity.length > 0 && recentActivity[0].type === 'test') {
      recommendations.push({
        title: 'Review your mistakes',
        description: 'Go through incorrect answers from your last test to learn and improve.',
        action: 'View Results',
        href: `/test/${recentActivity[0].testId}/results/${recentActivity[0].id}`,
        icon: BarChart3,
        color: 'text-purple-600',
      })
    }

    if (stats.currentStreak === 0) {
      recommendations.push({
        title: 'Start your daily practice',
        description: 'Build a habit by practicing daily. Try adaptive practice for personalized difficulty!',
        action: 'Practice Now',
        href: '/practice',
        icon: Flame,
        color: 'text-red-600',
      })
    }

    return recommendations.slice(0, 3)
  }

  const recommendations = getRecommendations()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile?.full_name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your learning progress and performance overview
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Tests Taken</div>
                <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalTests}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {stats.totalTests > 0 ? 'Keep going!' : 'Take your first test'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Average Score</div>
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {stats.avgScore.toFixed(1)}%
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.avgScore >= 70 ? 'Excellent!' : stats.avgScore >= 50 ? 'Good progress' : 'Keep practicing'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Questions Done</div>
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {stats.totalQuestionsAnswered}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {stats.totalQuestionsAnswered >= 100 ? 'Great practice!' : 'Practice more to improve'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Current Streak</div>
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {stats.currentStreak > 0 ? 'Keep the streak alive!' : 'Start your streak today'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest tests and practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            activity.type === 'test'
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : 'bg-green-100 dark:bg-green-900'
                          }`}
                        >
                          {activity.type === 'test' ? (
                            <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {activity.score}/{activity.totalMarks}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {((activity.score / activity.totalMarks) * 100).toFixed(0)}%
                          </div>
                        </div>
                        {activity.type === 'test' && activity.testId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/test/${activity.testId}/results/${activity.id}`)}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <ClipboardList className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No activity yet</p>
                  <Button onClick={() => router.push('/test')}>Take Your First Test</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommended
              </CardTitle>
              <CardDescription>Personalized suggestions for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <rec.icon className={`h-5 w-5 ${rec.color} flex-shrink-0`} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(rec.href)}
                  >
                    {rec.action}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Performance Trend */}
        {performanceTrend.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Over Time
              </CardTitle>
              <CardDescription>Your score trend across recent tests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Score']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score %"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Weak Areas Alert */}
        {weakAreas.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Areas Needing Attention
                  </h3>
                  <p className="text-orange-800 dark:text-orange-200 mb-4">
                    You have lower accuracy ({' <'}60%) in the following topics:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {weakAreas.map((area) => (
                      <Badge key={area} variant="secondary" className="bg-orange-200 dark:bg-orange-900">
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={() => router.push('/practice')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Practice These Topics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/practice')}>
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Start Practice</h3>
              <p className="text-blue-100">
                Choose a topic and practice at your own pace
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/test')}>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Take a Test</h3>
              <p className="text-purple-100">
                Experience real exam conditions with timed tests
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

