'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Download,
  RotateCcw,
  Home,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
} from 'recharts'

interface TestResultsProps {
  attempt: any
  test: any
  answers: any[]
  avgScore: number
  topScore: number
  totalAttempts: number
}

interface CategoryStats {
  name: string
  attempted: number
  correct: number
  incorrect: number
  accuracy: number
  timeTaken: number
}

interface SubcategoryStats {
  name: string
  accuracy: number
}

export function TestResults({
  attempt,
  test,
  answers,
  avgScore,
  topScore,
  totalAttempts,
}: TestResultsProps) {
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'incorrect' | 'marked' | 'skipped'>('all')

  // Calculate statistics
  const totalQuestions = attempt.total_questions
  const correctAnswers = attempt.correct_answers
  const scorePercentage = totalQuestions > 0 ? (attempt.score / test.total_marks) * 100 : 0
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  const timeInMinutes = Math.floor(attempt.time_taken_seconds / 60)
  const timeInSeconds = attempt.time_taken_seconds % 60

  // Group by categories for section-wise performance
  const categoryStats: Record<string, CategoryStats> = {}

  answers.forEach((answer) => {
    // Safely extract category name, handling nested relationships
    let categoryName = 'Other'
    if (answer.question) {
      const question = answer.question
      if (question.subcategory) {
        const subcategory = Array.isArray(question.subcategory) ? question.subcategory[0] : question.subcategory
        if (subcategory && typeof subcategory === 'object' && !('cardinality' in subcategory)) {
          if (subcategory.category) {
            const category = Array.isArray(subcategory.category) ? subcategory.category[0] : subcategory.category
            if (category && typeof category === 'object' && 'name' in category && !('cardinality' in category)) {
              categoryName = String(category.name)
            }
          }
        }
      }
    }

    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = {
        name: categoryName,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
        timeTaken: 0,
      }
    }

    categoryStats[categoryName].attempted += 1
    categoryStats[categoryName].timeTaken += answer.time_taken_seconds

    if (answer.is_correct) {
      categoryStats[categoryName].correct += 1
    } else {
      categoryStats[categoryName].incorrect += 1
    }
  })

  // Calculate accuracy for each category
  Object.values(categoryStats).forEach((cat) => {
    cat.accuracy = cat.attempted > 0 ? (cat.correct / cat.attempted) * 100 : 0
  })

  // Subcategory-wise accuracy for radar chart
  const subcategoryStats: Record<string, { total: number; correct: number }> = {}

  answers.forEach((answer) => {
    const subcat = answer.question?.subcategory?.name
    if (subcat) {
      if (!subcategoryStats[subcat]) {
        subcategoryStats[subcat] = { total: 0, correct: 0 }
      }
      subcategoryStats[subcat].total += 1
      if (answer.is_correct) {
        subcategoryStats[subcat].correct += 1
      }
    }
  })

  const radarData = Object.entries(subcategoryStats).map(([name, stats]) => ({
    subject: name.length > 15 ? name.substring(0, 15) + '...' : name,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    fullMark: 100,
  }))

  // Difficulty breakdown
  const difficultyStats = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  }

  answers.forEach((answer) => {
    const difficulty = answer.question?.difficulty || 'medium'
    if (difficultyStats[difficulty as keyof typeof difficultyStats]) {
      difficultyStats[difficulty as keyof typeof difficultyStats].total += 1
      if (answer.is_correct) {
        difficultyStats[difficulty as keyof typeof difficultyStats].correct += 1
      }
    }
  })

  const difficultyChartData = [
    {
      difficulty: 'Easy',
      attempted: difficultyStats.easy.total,
      correct: difficultyStats.easy.correct,
      accuracy:
        difficultyStats.easy.total > 0
          ? ((difficultyStats.easy.correct / difficultyStats.easy.total) * 100).toFixed(1)
          : 0,
    },
    {
      difficulty: 'Medium',
      attempted: difficultyStats.medium.total,
      correct: difficultyStats.medium.correct,
      accuracy:
        difficultyStats.medium.total > 0
          ? ((difficultyStats.medium.correct / difficultyStats.medium.total) * 100).toFixed(1)
          : 0,
    },
    {
      difficulty: 'Hard',
      attempted: difficultyStats.hard.total,
      correct: difficultyStats.hard.correct,
      accuracy:
        difficultyStats.hard.total > 0
          ? ((difficultyStats.hard.correct / difficultyStats.hard.total) * 100).toFixed(1)
          : 0,
    },
  ]

  // Time distribution per question
  const timeDistributionData = answers.map((answer, index) => ({
    question: `Q${index + 1}`,
    time: answer.time_taken_seconds,
  }))

  // Performance comparison data
  const comparisonData = [
    { name: 'Your Score', score: scorePercentage },
    { name: 'Average', score: avgScore > 0 ? (avgScore / test.total_marks) * 100 : 0 },
    { name: 'Top Score', score: topScore > 0 ? (topScore / test.total_marks) * 100 : 0 },
  ]

  // AI Insights
  const getStrengths = (): string[] => {
    const strengths: string[] = []
    Object.entries(categoryStats).forEach(([name, stats]) => {
      if (stats.accuracy >= 75) {
        strengths.push(`${name} (${stats.accuracy.toFixed(0)}% accuracy)`)
      }
    })
    if (difficultyStats.easy.total > 0 && difficultyStats.easy.correct / difficultyStats.easy.total >= 0.8) {
      strengths.push(`Strong performance in Easy questions`)
    }
    return strengths.length > 0 ? strengths : ['Keep practicing to identify your strengths']
  }

  const getWeaknesses = (): string[] => {
    const weaknesses: string[] = []
    Object.entries(categoryStats).forEach(([name, stats]) => {
      if (stats.accuracy < 50) {
        weaknesses.push(`${name} (${stats.accuracy.toFixed(0)}% accuracy)`)
      }
    })
    if (difficultyStats.hard.total > 0 && difficultyStats.hard.correct / difficultyStats.hard.total < 0.5) {
      weaknesses.push(`Hard questions need more practice`)
    }
    return weaknesses.length > 0 ? weaknesses : ['Great! No major weaknesses identified']
  }

  const getTimeManagementInsight = (): string => {
    const avgTimePerQ = attempt.time_taken_seconds / totalQuestions
    if (avgTimePerQ < 45) {
      return 'You answered quickly. Consider spending more time per question for better accuracy.'
    } else if (avgTimePerQ > 120) {
      return 'You spent considerable time per question. Practice time management in timed sessions.'
    }
    return 'Your time management was balanced across questions.'
  }

  const getRecommendations = (): string[] => {
    const recommendations: string[] = []
    const weakCategories = Object.entries(categoryStats)
      .filter(([_, stats]) => stats.accuracy < 60)
      .map(([name]) => name)

    if (weakCategories.length > 0) {
      recommendations.push(`Focus on practicing: ${weakCategories.join(', ')}`)
    }

    if (accuracy < 70) {
      recommendations.push('Take more practice sessions to improve accuracy')
    }

    if (difficultyStats.hard.total > 0 && difficultyStats.hard.correct / difficultyStats.hard.total < 0.5) {
      recommendations.push('Practice more hard-level questions')
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work! Try a full-length mock test')
    }

    return recommendations
  }

  // Filter answers based on selected filter
  const filteredAnswers = answers.filter((answer) => {
    if (filterType === 'incorrect') return !answer.is_correct
    if (filterType === 'marked') return answer.is_marked_for_review
    if (filterType === 'skipped') return answer.is_skipped
    return true
  })

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleDownloadReport = () => {
    // TODO: Implement PDF generation
    alert('PDF download feature coming soon!')
  }

  const handleRetakeTest = () => {
    router.push('/test')
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test Results</h1>
          <p className="text-gray-600 dark:text-gray-400">{test.title}</p>
        </div>

        {/* Main Score Card */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {attempt.score}/{test.total_marks}
                </div>
                <div className="text-xl text-gray-600 dark:text-gray-400">
                  {scorePercentage.toFixed(1)}%
                </div>
                {attempt.percentile && (
                  <Badge variant="secondary" className="mt-2">
                    {attempt.percentile}th Percentile
                  </Badge>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Time Taken</span>
                </div>
                <div className="text-2xl font-semibold">
                  {timeInMinutes}m {timeInSeconds}s
                </div>
                <div className="text-sm text-gray-500">out of {test.duration_minutes} minutes</div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy</span>
                </div>
                <div className="text-2xl font-semibold">{accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">
                  {correctAnswers} correct out of {totalQuestions}
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rank</span>
                </div>
                <div className="text-2xl font-semibold">
                  {attempt.rank ? `#${attempt.rank}` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">out of {totalAttempts} test takers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for detailed analysis */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Section-wise Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Section-wise Performance</CardTitle>
                <CardDescription>Your performance across different topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Section</th>
                        <th className="text-center p-3 font-semibold">Attempted</th>
                        <th className="text-center p-3 font-semibold">Correct</th>
                        <th className="text-center p-3 font-semibold">Incorrect</th>
                        <th className="text-center p-3 font-semibold">Accuracy</th>
                        <th className="text-center p-3 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(categoryStats).map((cat) => (
                        <tr key={cat.name} className="border-b last:border-0">
                          <td className="p-3 font-medium">{cat.name}</td>
                          <td className="text-center p-3">{cat.attempted}</td>
                          <td className="text-center p-3 text-green-600">{cat.correct}</td>
                          <td className="text-center p-3 text-red-600">{cat.incorrect}</td>
                          <td className="text-center p-3">
                            <Badge
                              variant={cat.accuracy >= 75 ? 'default' : cat.accuracy >= 50 ? 'secondary' : 'destructive'}
                            >
                              {cat.accuracy.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="text-center p-3">
                            {Math.floor(cat.timeTaken / 60)}m {cat.timeTaken % 60}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>How you performed against others</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {/* Topic-wise Accuracy Radar Chart */}
            {radarData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Topic-wise Accuracy</CardTitle>
                  <CardDescription>Your performance across different subcategories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Accuracy"
                        dataKey="accuracy"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
                <CardDescription>Time spent on each question</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="question" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}s`} />
                    <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Difficulty-wise Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Difficulty-wise Breakdown</CardTitle>
                <CardDescription>Performance by question difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attempted" fill="#94a3b8" name="Attempted" />
                    <Bar dataKey="correct" fill="#22c55e" name="Correct" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {difficultyChartData.map((item) => (
                    <div key={item.difficulty} className="text-center">
                      <div className="text-2xl font-bold">{item.accuracy}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.difficulty} Questions
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI-Powered Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getStrengths().map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getWeaknesses().map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Clock className="h-5 w-5" />
                    Time Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{getTimeManagementInsight()}</p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <Lightbulb className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getRecommendations().map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Solutions Tab */}
          <TabsContent value="solutions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Review</CardTitle>
                <CardDescription>Review all questions and their solutions</CardDescription>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    Show All ({answers.length})
                  </Button>
                  <Button
                    variant={filterType === 'incorrect' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('incorrect')}
                  >
                    Incorrect Only ({answers.filter((a) => !a.is_correct).length})
                  </Button>
                  <Button
                    variant={filterType === 'marked' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('marked')}
                  >
                    Marked for Review ({answers.filter((a) => a.is_marked_for_review).length})
                  </Button>
                  <Button
                    variant={filterType === 'skipped' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('skipped')}
                  >
                    Skipped ({answers.filter((a) => a.is_skipped).length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredAnswers.map((answer, index) => {
                  const question = answer.question
                  const isExpanded = expandedQuestions.has(answer.id)

                  return (
                    <Card key={answer.id} className="border-2">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                Q{answers.findIndex((a) => a.id === answer.id) + 1}
                              </Badge>
                              <Badge variant="secondary">
                                {(() => {
                                  // Safely extract category name
                                  if (!question?.subcategory) return 'Other'
                                  const subcategory = Array.isArray(question.subcategory) ? question.subcategory[0] : question.subcategory
                                  if (!subcategory || typeof subcategory !== 'object' || 'cardinality' in subcategory) return 'Other'
                                  if (!subcategory.category) return 'Other'
                                  const category = Array.isArray(subcategory.category) ? subcategory.category[0] : subcategory.category
                                  if (!category || typeof category !== 'object' || 'name' in category === false || 'cardinality' in category) return 'Other'
                                  return String(category.name)
                                })()}
                              </Badge>
                              <Badge
                                variant={
                                  question?.difficulty === 'easy'
                                    ? 'default'
                                    : question?.difficulty === 'hard'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {question?.difficulty}
                              </Badge>
                              {answer.is_correct ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <CardTitle className="text-lg font-normal">
                              {question?.question_text}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Time Taken: {answer.time_taken_seconds}s
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Marks: {answer.marks_obtained}/{question?.marks}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Your Answer:</span>
                            <Badge variant={answer.is_correct ? 'default' : 'destructive'}>
                              {answer.user_answer || 'Not Answered'}
                            </Badge>
                          </div>

                          {!answer.is_correct && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Correct Answer:</span>
                              <Badge variant="default" className="bg-green-500">
                                {question?.correct_answer}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleQuestion(answer.id)}
                          className="w-full justify-between"
                        >
                          <span>View Explanation</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {isExpanded && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="font-semibold mb-2">Explanation:</p>
                            <p className="text-gray-700 dark:text-gray-300">{question?.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {filteredAnswers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No questions match the selected filter.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button onClick={handleDownloadReport} variant="outline" size="lg">
            <Download className="mr-2 h-5 w-5" />
            Download Report
          </Button>
          <Button onClick={handleRetakeTest} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            Retake Test
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

