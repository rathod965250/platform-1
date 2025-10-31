'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  RotateCcw,
  Lightbulb,
} from 'lucide-react'

interface PracticeSummaryProps {
  session: any
  sessionStats: any
  metrics: any[]
  recommendations: any[]
  categoryId: string
}

export function PracticeSummary({
  session,
  sessionStats,
  metrics,
  recommendations,
  categoryId,
}: PracticeSummaryProps) {
  const router = useRouter()

  const totalQuestions = session.total_questions || metrics.length
  const correctQuestions = session.correct_answers || metrics.filter((m) => m.is_correct).length
  const accuracy = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0
  const timeInMinutes = session.time_taken_seconds
    ? Math.floor(session.time_taken_seconds / 60)
    : sessionStats?.session_duration_seconds
    ? Math.floor(sessionStats.session_duration_seconds / 60)
    : 0

  const improvementRate = sessionStats?.improvement_rate || 0
  const avgTime = sessionStats?.avg_time_seconds || 0

  const handlePracticeAgain = () => {
    router.push(`/practice/configure/${categoryId}`)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Practice Session Complete!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {session.category?.name} - Review your performance
          </p>
        </div>

        {/* Score Card */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {correctQuestions}/{totalQuestions}
                </div>
                <div className="text-xl text-gray-600 dark:text-gray-400">
                  {accuracy.toFixed(1)}% Accuracy
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-2xl font-semibold">{timeInMinutes}m</div>
                <div className="text-sm text-gray-500">Time Taken</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-2xl font-semibold">
                  {improvementRate >= 0 ? '+' : ''}
                  {improvementRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Improvement Rate</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-2xl font-semibold">{avgTime}s</div>
                <div className="text-sm text-gray-500">Avg Time/Question</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Topic-wise Performance */}
          {sessionStats?.topic_wise_accuracy && Object.keys(sessionStats.topic_wise_accuracy).length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Topic-wise Performance</CardTitle>
                <CardDescription>Your accuracy across different topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(sessionStats.topic_wise_accuracy).map(([topic, accuracy]: [string, any]) => (
                    <div key={topic} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{topic}</span>
                        <span className="text-gray-600 dark:text-gray-400">{accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={accuracy} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                Recommendations
              </CardTitle>
              <CardDescription>Personalized suggestions for you</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.slice(0, 3).map((rec: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        {rec.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {rec.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keep practicing to receive personalized recommendations!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Review */}
        {metrics.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
              <CardDescription>Review your answers and explanations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.slice(0, 10).map((metric: any, index: number) => (
                  <div
                    key={metric.id}
                    className={`p-4 rounded-lg border-2 ${
                      metric.is_correct
                        ? 'border-green-200 bg-green-50 dark:bg-green-950'
                        : 'border-red-200 bg-red-50 dark:bg-red-950'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {metric.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">Q{index + 1}</Badge>
                          {metric.subcategory?.name && (
                            <Badge variant="outline">{metric.subcategory.name}</Badge>
                          )}
                          <Badge
                            variant={
                              metric.difficulty === 'easy'
                                ? 'default'
                                : metric.difficulty === 'hard'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {metric.difficulty}
                          </Badge>
                        </div>
                        {metric.question?.question_text && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {metric.question.question_text.substring(0, 150)}
                            {metric.question.question_text.length > 150 ? '...' : ''}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          Time: {metric.time_taken_seconds}s
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {metrics.length > 10 && (
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
                  Showing first 10 questions. View all in your dashboard.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={handlePracticeAgain} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            Practice Again
          </Button>
          <Button onClick={handleBackToDashboard} size="lg">
            <Home className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

