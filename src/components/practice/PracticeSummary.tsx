'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  RotateCcw,
  Lightbulb,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  Zap,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface PracticeSummaryProps {
  session: any
  sessionStats: any
  metrics: any[]
  recommendations: any[]
  categoryId: string
  weakAreas: Array<{
    topic: string
    incorrectCount: number
    correctCount: number
    totalAttempted: number
    accuracy: number
    errorPercentage: number
  }>
  attemptedCount: number
  notAttemptedCount: number
  skippedCount: number
  incorrectCount: number
  correctCount: number
  finalMastery: number
  startingMastery: number
  masteryChange: number
}

export function PracticeSummary({
  session,
  sessionStats,
  metrics,
  recommendations,
  categoryId,
  weakAreas,
  attemptedCount,
  notAttemptedCount,
  skippedCount,
  incorrectCount,
  correctCount,
  finalMastery,
  startingMastery,
  masteryChange,
}: PracticeSummaryProps) {
  const router = useRouter()
  const [showQuestionReview, setShowQuestionReview] = useState(false)
  const [showPerformanceBreakdown, setShowPerformanceBreakdown] = useState(false)
  const [showMasteryChart, setShowMasteryChart] = useState(false)
  const [showPerformanceTrends, setShowPerformanceTrends] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 20

  const totalQuestions = session.total_questions || metrics.length || 0
  // Calculate accuracy based on attempted questions, not total questions
  const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0
  const timeInMinutes = session.time_taken_seconds
    ? Math.floor(session.time_taken_seconds / 60)
    : sessionStats?.session_duration_seconds
    ? Math.floor(sessionStats.session_duration_seconds / 60)
    : 0

  const improvementRate = sessionStats?.improvement_rate || 0
  // Calculate average time from metrics if sessionStats doesn't have it
  const avgTime = sessionStats?.avg_time_seconds || (metrics.length > 0 && attemptedCount > 0
    ? Math.round(metrics.reduce((sum: number, m: any) => sum + (m.time_taken_seconds || 0), 0) / attemptedCount)
    : 0)

  // Get achievement message based on performance
  const getAchievementMessage = () => {
    if (accuracy >= 80) return { message: 'Excellent Work!', color: 'text-green-600 dark:text-green-400' }
    if (accuracy >= 60) return { message: 'Great Progress!', color: 'text-blue-600 dark:text-blue-400' }
    if (accuracy >= 40) return { message: 'Keep Practicing!', color: 'text-yellow-600 dark:text-yellow-400' }
    return { message: 'You Can Do Better!', color: 'text-orange-600 dark:text-orange-400' }
  }

  const achievement = getAchievementMessage()

  // Get accuracy color
  const getAccuracyColor = () => {
    if (accuracy >= 70) return 'text-green-600 dark:text-green-400'
    if (accuracy >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  // Calculate difficulty breakdown
  const difficultyStats = {
    easy: { total: 0, correct: 0, attempted: 0 },
    medium: { total: 0, correct: 0, attempted: 0 },
    hard: { total: 0, correct: 0, attempted: 0 },
  }

  metrics.forEach((metric: any) => {
    // Get difficulty from metric first, then from question, default to 'medium'
    const diff = (metric.difficulty || metric.question?.difficulty || 'medium').toLowerCase()
    // Ensure it's a valid difficulty level
    const validDiff = ['easy', 'medium', 'hard'].includes(diff) ? diff : 'medium'
    
    if (difficultyStats[validDiff as keyof typeof difficultyStats]) {
      difficultyStats[validDiff as keyof typeof difficultyStats].total += 1
      // Check if question was attempted (is_correct is not null)
      if (metric.is_correct !== null && metric.is_correct !== undefined) {
        difficultyStats[validDiff as keyof typeof difficultyStats].attempted += 1
        if (metric.is_correct === true) {
          difficultyStats[validDiff as keyof typeof difficultyStats].correct += 1
        }
      }
    }
  })

  // Calculate subcategory breakdown
  const subcategoryStats = new Map<string, { total: number; correct: number; attempted: number; totalTime: number }>()
  metrics.forEach((metric: any) => {
    const subcatName = metric.subcategory?.name || 'Unknown'
    const current = subcategoryStats.get(subcatName) || { total: 0, correct: 0, attempted: 0, totalTime: 0 }
    current.total += 1
    // Handle both boolean and numeric values for is_correct
    const isAttempted = metric.is_correct !== null && metric.is_correct !== undefined
    if (isAttempted) {
      current.attempted += 1
      current.totalTime += metric.time_taken_seconds || 0
      // Check for both boolean true and numeric 1
      if (metric.is_correct === true || metric.is_correct === 1) {
        current.correct += 1
      }
    }
    subcategoryStats.set(subcatName, current)
  })

  // Calculate mastery progression data
  const masteryProgressionData = metrics
    .filter((m: any) => m.mastery_score_after !== null)
    .map((m: any, index: number) => ({
      question: index + 1,
      mastery: parseFloat((m.mastery_score_after * 100).toFixed(1)),
      difficulty: m.difficulty,
    }))

  // Calculate difficulty transitions
  const difficultyTransitions: Array<{ from: string; to: string; question: number }> = []
  metrics.forEach((metric: any, index: number) => {
    if (metric.previous_difficulty && metric.difficulty && metric.previous_difficulty !== metric.difficulty) {
      difficultyTransitions.push({
        from: metric.previous_difficulty,
        to: metric.difficulty,
        question: index + 1,
      })
    }
  })

  // Calculate time by difficulty
  const timeByDifficulty = {
    easy: { total: 0, count: 0, avg: 0 },
    medium: { total: 0, count: 0, avg: 0 },
    hard: { total: 0, count: 0, avg: 0 },
  }
  metrics.forEach((metric: any) => {
    // Only count time for attempted questions
    if (metric.is_correct !== null && metric.is_correct !== undefined && metric.time_taken_seconds) {
      // Get difficulty from metric first, then from question, default to 'medium'
      const diff = (metric.difficulty || metric.question?.difficulty || 'medium').toLowerCase().trim()
      const validDiff = ['easy', 'medium', 'hard'].includes(diff) ? diff : 'medium'
      if (timeByDifficulty[validDiff as keyof typeof timeByDifficulty]) {
        timeByDifficulty[validDiff as keyof typeof timeByDifficulty].total += metric.time_taken_seconds
        timeByDifficulty[validDiff as keyof typeof timeByDifficulty].count += 1
      }
    }
  })
  Object.keys(timeByDifficulty).forEach((diff) => {
    const stats = timeByDifficulty[diff as keyof typeof timeByDifficulty]
    stats.avg = stats.count > 0 ? Math.round(stats.total / stats.count) : 0
  })

  // Calculate performance trends (first half vs second half)
  const halfPoint = Math.floor(metrics.length / 2)
  const firstHalf = metrics.slice(0, halfPoint)
  const secondHalf = metrics.slice(halfPoint)
  
  // Filter only attempted questions for accuracy calculation
  const firstHalfAttempted = firstHalf.filter((m: any) => m.is_correct !== null && m.is_correct !== undefined)
  const secondHalfAttempted = secondHalf.filter((m: any) => m.is_correct !== null && m.is_correct !== undefined)
  
  const firstHalfCorrect = firstHalfAttempted.filter((m: any) => m.is_correct === true || m.is_correct === 1).length
  const secondHalfCorrect = secondHalfAttempted.filter((m: any) => m.is_correct === true || m.is_correct === 1).length
  const firstHalfAccuracy = firstHalfAttempted.length > 0 ? (firstHalfCorrect / firstHalfAttempted.length) * 100 : 0
  const secondHalfAccuracy = secondHalfAttempted.length > 0 ? (secondHalfCorrect / secondHalfAttempted.length) * 100 : 0
  const accuracyTrend = secondHalfAccuracy - firstHalfAccuracy

  // Calculate streaks
  let longestCorrectStreak = 0
  let longestIncorrectStreak = 0
  let tempCorrectStreak = 0
  let tempIncorrectStreak = 0

  metrics.forEach((metric: any) => {
    // Only count streaks for attempted questions
    if (metric.is_correct !== null && metric.is_correct !== undefined) {
      if (metric.is_correct === true || metric.is_correct === 1) {
        tempCorrectStreak += 1
        tempIncorrectStreak = 0
        longestCorrectStreak = Math.max(longestCorrectStreak, tempCorrectStreak)
      } else if (metric.is_correct === false || metric.is_correct === 0) {
        tempIncorrectStreak += 1
        tempCorrectStreak = 0
        longestIncorrectStreak = Math.max(longestIncorrectStreak, tempIncorrectStreak)
      }
    }
  })

  // Pagination for question review
  const totalPages = Math.ceil(metrics.length / questionsPerPage)
  const paginatedMetrics = metrics.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  )

  // Get session configuration
  const sessionConfig = session.config || {}
  const selectedSubcategories = sessionConfig.selected_subcategories || []
  const questionCount = sessionConfig.question_count || session.total_questions || totalQuestions

  const handlePracticeAgain = () => {
    router.push(`/practice/configure/${categoryId}`)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handlePracticeWeakAreas = () => {
    // Navigate to practice configuration
    router.push(`/practice/configure/${categoryId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-3 sm:py-4 md:py-6 lg:py-8">
      <div className="container mx-auto px-3 sm:px-4 md:px-5 lg:px-6 max-w-7xl">
        {/* Hero Performance Card */}
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 dark:from-primary/10 dark:via-accent/10 dark:to-primary/20 border-primary/20 dark:border-primary/30 shadow-lg">
          <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
                  Practice Session Complete!
                </h1>
              </div>
              <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${achievement.color} mb-2`}>
                {achievement.message}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                {session.category?.name || 'Practice Session'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {/* Accuracy */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 ${getAccuracyColor()}`}>
                  {accuracy.toFixed(1)}%
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Accuracy</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {correctCount} / {attemptedCount > 0 ? attemptedCount : totalQuestions} correct
                </div>
              </div>

              {/* Time */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                  {timeInMinutes}m
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Time Taken</div>
              </div>

              {/* Mastery Score */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                  {(finalMastery * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Mastery Score</div>
                {masteryChange !== 0 && (
                  <div className="flex items-center justify-center gap-1 mt-0.5 sm:mt-1">
                    {masteryChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-chart-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-[9px] sm:text-[10px] md:text-xs font-medium ${masteryChange > 0 ? 'text-chart-1' : 'text-destructive'}`}>
                      {(masteryChange * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Improvement */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                  {improvementRate >= 0 ? '+' : ''}
                  {improvementRate.toFixed(1)}%
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Improvement</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Statistics Section */}
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Session Statistics</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              Comprehensive breakdown of your practice session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-chart-1 mb-0.5 sm:mb-1">
                  {attemptedCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Attempted</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {totalQuestions > 0 ? ((attemptedCount / totalQuestions) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground mb-0.5 sm:mb-1">
                  {notAttemptedCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Not Attempted</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {totalQuestions > 0 ? ((notAttemptedCount / totalQuestions) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-chart-3 mb-0.5 sm:mb-1">
                  {skippedCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Skipped</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {totalQuestions > 0 ? ((skippedCount / totalQuestions) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg border border-chart-1/30 bg-chart-1/5 dark:bg-chart-1/10">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-chart-1 mb-0.5 sm:mb-1">
                  {correctCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Correct</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg border border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive mb-0.5 sm:mb-1">
                  {incorrectCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Incorrect</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {attemptedCount > 0 ? ((incorrectCount / attemptedCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground mx-auto mb-0.5 sm:mb-1" />
                <div className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                  {avgTime}s
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Avg Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weak Areas Analysis - Priority Section */}
        {weakAreas.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                Focus Areas - Practice These Topics
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Topics where you need more practice based on your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                {weakAreas.slice(0, 5).map((area, index) => {
                  return (
                    <div
                      key={index}
                      className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-destructive/20 bg-card"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground truncate">
                              {area.topic || 'Unknown Topic'}
                            </span>
                            <Badge variant="destructive" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">
                              {area.incorrectCount} errors
                            </Badge>
                          </div>
                          <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                            {area.totalAttempted} attempted • {area.accuracy.toFixed(1)}% accuracy
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-right">
                            <div className="text-xs sm:text-sm md:text-base font-semibold text-foreground">
                              {area.accuracy.toFixed(0)}%
                            </div>
                            <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Accuracy</div>
                          </div>
                          <Progress
                            value={area.accuracy}
                            className="w-16 sm:w-20 md:w-24 h-1.5 sm:h-2"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actionable Recommendations */}
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              What's Next?
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              Actionable steps to improve your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
              {weakAreas.length > 0 && (
                <div className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm md:text-base text-foreground mb-1">
                        Practice Weak Areas
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-2 sm:mb-3">
                        Focus on the topics above to improve your overall performance
                      </div>
                      <Button
                        onClick={handlePracticeWeakAreas}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 sm:h-10 text-xs sm:text-sm"
                      >
                        Practice Now
                        <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-2 sm:space-y-2.5">
                  {recommendations.slice(0, 2).map((rec: any, index: number) => (
                    <div
                      key={index}
                      className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="font-semibold text-xs sm:text-sm md:text-base text-foreground mb-1">
                        {rec.title}
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                        {rec.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Overview Minimap */}
        {metrics.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Question Overview</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Visual summary of all questions in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {metrics.map((metric: any, index: number) => {
                  // Handle both boolean and numeric values
                  const isCorrect = metric.is_correct === true || metric.is_correct === 1
                  const isIncorrect = metric.is_correct === false || metric.is_correct === 0
                  const isNotAttempted = metric.is_correct === null || metric.is_correct === undefined

                  let buttonClass = 'relative p-1 sm:p-1.5 md:p-2 rounded-md border-2 transition-all text-[10px] sm:text-xs font-semibold text-center min-h-[32px] sm:min-h-[36px] md:min-h-[40px] flex items-center justify-center cursor-pointer hover:scale-105 '
                  
                  if (isCorrect) {
                    buttonClass += 'border-chart-1 bg-chart-1 text-primary-foreground'
                  } else if (isIncorrect) {
                    buttonClass += 'border-destructive bg-destructive text-destructive-foreground'
                  } else {
                    buttonClass += 'border-border bg-muted text-muted-foreground'
                  }

                  return (
                    <button
                      key={metric.id || `metric-${index}`}
                      className={buttonClass}
                      title={`Q${index + 1}: ${isCorrect ? 'Correct' : isIncorrect ? 'Incorrect' : 'Not Attempted'}`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm pt-2 sm:pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-chart-1 bg-chart-1"></div>
                  <span className="text-muted-foreground">Correct ({correctCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-destructive bg-destructive"></div>
                  <span className="text-muted-foreground">Incorrect ({incorrectCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-border bg-muted"></div>
                  <span className="text-muted-foreground">Not Attempted ({notAttemptedCount})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mastery Progression Chart */}
        {masteryProgressionData.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <CardHeader className="pb-2 sm:pb-3">
              <button
                onClick={() => setShowMasteryChart(!showMasteryChart)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Mastery Score Progression
                </CardTitle>
                {showMasteryChart ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </button>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Track how your mastery score changed throughout the session
              </CardDescription>
            </CardHeader>
            {showMasteryChart && (
              <CardContent>
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={masteryProgressionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="question" 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '10px' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '10px' }}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Mastery %', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '11px',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Mastery']}
                      />
                      <Line
                        type="monotone"
                        dataKey="mastery"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                  <div>
                    Starting: <span className="font-semibold text-foreground">{(startingMastery * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    Ending: <span className="font-semibold text-foreground">{(finalMastery * 100).toFixed(1)}%</span>
                  </div>
                  {masteryChange !== 0 && (
                    <div className={`font-semibold ${masteryChange > 0 ? 'text-chart-1' : 'text-destructive'}`}>
                      Change: {masteryChange > 0 ? '+' : ''}{(masteryChange * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Performance Breakdown - Collapsible */}
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <CardHeader className="pb-2 sm:pb-3">
            <button
              onClick={() => setShowPerformanceBreakdown(!showPerformanceBreakdown)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Performance Breakdown</CardTitle>
              {showPerformanceBreakdown ? (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              )}
            </button>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              Detailed analysis by difficulty and subcategory
            </CardDescription>
          </CardHeader>
          {showPerformanceBreakdown && (
            <CardContent className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Difficulty Performance */}
              <div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-2 sm:mb-3">
                  Performance by Difficulty
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => {
                    const stats = difficultyStats[diff]
                    const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0
                    const timeStats = timeByDifficulty[diff]
                    return (
                      <div key={diff} className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5 sm:mb-2">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Badge
                              variant={
                                diff === 'easy' ? 'default' : diff === 'hard' ? 'destructive' : 'secondary'
                              }
                              className="capitalize text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5"
                            >
                              {diff}
                            </Badge>
                            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              {stats.attempted} attempted
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              Avg Time: {timeStats.avg}s
                            </span>
                            <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground">
                              {accuracy.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={accuracy} className="h-1.5 sm:h-2" />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Difficulty Distribution Chart - Enhanced Interactive */}
              <div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-2 sm:mb-3">
                  Questions by Difficulty
                </h3>
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { 
                          name: 'Easy', 
                          total: difficultyStats.easy.total,
                          attempted: difficultyStats.easy.attempted,
                          correct: difficultyStats.easy.correct,
                          accuracy: difficultyStats.easy.attempted > 0 ? (difficultyStats.easy.correct / difficultyStats.easy.attempted) * 100 : 0,
                          color: 'hsl(var(--chart-1))'
                        },
                        { 
                          name: 'Medium', 
                          total: difficultyStats.medium.total,
                          attempted: difficultyStats.medium.attempted,
                          correct: difficultyStats.medium.correct,
                          accuracy: difficultyStats.medium.attempted > 0 ? (difficultyStats.medium.correct / difficultyStats.medium.attempted) * 100 : 0,
                          color: 'hsl(var(--primary))'
                        },
                        { 
                          name: 'Hard', 
                          total: difficultyStats.hard.total,
                          attempted: difficultyStats.hard.attempted,
                          correct: difficultyStats.hard.correct,
                          accuracy: difficultyStats.hard.attempted > 0 ? (difficultyStats.hard.correct / difficultyStats.hard.attempted) * 100 : 0,
                          color: 'hsl(var(--destructive))'
                        },
                      ]}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: '11px', fontWeight: 500 }} 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: '10px' }} 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        label={{ value: 'Questions', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fill: 'hsl(var(--muted-foreground))' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '11px',
                          padding: '8px 12px',
                        }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'Total') {
                            return [`${value} questions`, 'Total Questions']
                          } else if (name === 'Attempted') {
                            return [`${value} questions`, 'Attempted']
                          } else if (name === 'Correct') {
                            return [`${value} questions`, 'Correct']
                          } else if (name === 'Accuracy') {
                            return [`${value.toFixed(1)}%`, 'Accuracy']
                          }
                          return [value, name]
                        }}
                        labelFormatter={(label) => `Difficulty: ${label}`}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        iconType="circle"
                      />
                      <Bar 
                        dataKey="total" 
                        name="Total"
                        fill="hsl(var(--muted-foreground))" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.3}
                      />
                      <Bar 
                        dataKey="attempted" 
                        name="Attempted"
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.6}
                      />
                      <Bar 
                        dataKey="correct" 
                        name="Correct"
                        fill="hsl(var(--chart-1))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Chart Legend */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-muted-foreground/30"></div>
                    <span className="text-muted-foreground">Total: {difficultyStats.easy.total + difficultyStats.medium.total + difficultyStats.hard.total}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary/60"></div>
                    <span className="text-muted-foreground">Attempted: {difficultyStats.easy.attempted + difficultyStats.medium.attempted + difficultyStats.hard.attempted}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-chart-1"></div>
                    <span className="text-muted-foreground">Correct: {difficultyStats.easy.correct + difficultyStats.medium.correct + difficultyStats.hard.correct}</span>
                  </div>
                </div>
              </div>

              {/* Difficulty Transitions */}
              {difficultyTransitions.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-2 sm:mb-3">
                    Difficulty Transitions ({difficultyTransitions.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {difficultyTransitions.slice(0, 10).map((transition, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[9px] sm:text-[10px] md:text-xs capitalize px-1.5 py-0.5"
                      >
                        Q{transition.question}: {transition.from} → {transition.to}
                      </Badge>
                    ))}
                    {difficultyTransitions.length > 10 && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">
                        +{difficultyTransitions.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Subcategory Performance */}
              {subcategoryStats.size > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-2 sm:mb-3">
                    Performance by Subcategory
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {Array.from(subcategoryStats.entries()).map(([subcat, stats]) => {
                      const accuracy = stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0
                      const avgTime = stats.attempted > 0 ? Math.round(stats.totalTime / stats.attempted) : 0
                      return (
                        <div key={subcat} className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-border bg-card">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <span className="text-xs sm:text-sm md:text-base font-medium text-foreground truncate">
                                {subcat}
                              </span>
                              <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground flex-shrink-0">
                                {stats.attempted} attempted
                              </span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                              <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                                Avg Time: {avgTime}s
                              </span>
                              <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground">
                                {accuracy.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <Progress value={accuracy} className="h-1.5 sm:h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Performance Trends */}
        {metrics.length > 4 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <CardHeader className="pb-2 sm:pb-3">
              <button
                onClick={() => setShowPerformanceTrends(!showPerformanceTrends)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Performance Trends
                </CardTitle>
                {showPerformanceTrends ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </button>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Analyze your performance patterns throughout the session
              </CardDescription>
            </CardHeader>
            {showPerformanceTrends && (
              <CardContent className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* First Half vs Second Half */}
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-2 sm:mb-3">
                    First Half vs Second Half
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10">
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1">First Half</div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                        {firstHalfAccuracy.toFixed(1)}%
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                        {firstHalfCorrect} / {firstHalfAttempted.length} correct
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-chart-1/30 bg-chart-1/5 dark:bg-chart-1/10">
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-1">Second Half</div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-chart-1">
                        {secondHalfAccuracy.toFixed(1)}%
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                        {secondHalfCorrect} / {secondHalfAttempted.length} correct
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm">
                    <span className="text-muted-foreground">Trend:</span>
                    {accuracyTrend > 0 ? (
                      <span className="text-chart-1 font-semibold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        Improved by {accuracyTrend.toFixed(1)}%
                      </span>
                    ) : accuracyTrend < 0 ? (
                      <span className="text-destructive font-semibold flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        Declined by {Math.abs(accuracyTrend).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </div>
                </div>

                {/* Streak Analysis */}
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-2 sm:mb-3">
                    Streak Analysis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-chart-1/30 bg-chart-1/5 dark:bg-chart-1/10">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-chart-1" />
                        <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Longest Correct Streak</span>
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-chart-1">
                        {longestCorrectStreak}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">consecutive correct answers</div>
                    </div>
                    <div className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                        <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Longest Incorrect Streak</span>
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-destructive">
                        {longestIncorrectStreak}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">consecutive incorrect answers</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Question Review - Expandable */}
        {metrics.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <CardHeader className="pb-2 sm:pb-3">
              <button
                onClick={() => setShowQuestionReview(!showQuestionReview)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Question Review</CardTitle>
                {showQuestionReview ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </button>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Review your answers and explanations
              </CardDescription>
            </CardHeader>
            {showQuestionReview && (
            <CardContent>
                {/* Filter and Sort Options */}
                <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm">
                  <span className="text-muted-foreground">Showing:</span>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">
                    Page {currentPage} of {totalPages}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">
                    {paginatedMetrics.length} questions
                  </Badge>
                </div>

                <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                  {paginatedMetrics.map((metric: any, index: number) => {
                    const globalIndex = (currentPage - 1) * questionsPerPage + index
                    // Handle both boolean and numeric values
                    const isCorrect = metric.is_correct === true || metric.is_correct === 1
                    const isIncorrect = metric.is_correct === false || metric.is_correct === 0
                    const isNotAttempted = metric.is_correct === null || metric.is_correct === undefined
                    
                    return (
                  <div
                    key={metric.id || `metric-${globalIndex}`}
                      className={`p-2.5 sm:p-3 md:p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'border-chart-1/30 bg-chart-1/5 dark:bg-chart-1/10'
                        : isIncorrect
                        ? 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-chart-1 mt-0.5 flex-shrink-0" />
                        ) : isIncorrect ? (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">Q{globalIndex + 1}</Badge>
                          {metric.subcategory?.name && (
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">{metric.subcategory.name}</Badge>
                          )}
                          <Badge
                            variant={
                              (metric.difficulty || metric.question?.difficulty || 'medium') === 'easy'
                                ? 'default'
                                : (metric.difficulty || metric.question?.difficulty || 'medium') === 'hard'
                                ? 'destructive'
                                : 'secondary'
                            }
                              className="text-[9px] sm:text-[10px] md:text-xs capitalize px-1.5 py-0.5"
                          >
                            {metric.difficulty || metric.question?.difficulty || 'medium'}
                          </Badge>
                            {metric.question?.question_topic && (
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">
                                {metric.question.question_topic}
                              </Badge>
                            )}
                        </div>
                          {metric.question?.['question text'] && (
                            <p className="text-[10px] sm:text-xs md:text-sm text-foreground mb-1.5 sm:mb-2 line-clamp-2">
                              {metric.question['question text'].substring(0, 150)}
                              {metric.question['question text'].length > 150 ? '...' : ''}
                          </p>
                        )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                            {isNotAttempted ? (
                              <span className="text-muted-foreground/60">Not Attempted</span>
                            ) : (
                              <>
                                <span>Time: {metric.time_taken_seconds || 0}s</span>
                                {isIncorrect && metric.question?.['correct answer'] && (
                                  <span>Correct: {metric.question['correct answer']}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 text-xs sm:text-sm"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
              )}
            </CardContent>
            )}
          </Card>
        )}

        {/* Session Configuration - Footer */}
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Session Information</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              Details about this practice session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Session Date</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {new Date(session.completed_at || session.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {new Date(session.completed_at || session.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Duration</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {timeInMinutes} minutes
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {session.time_taken_seconds || sessionStats?.session_duration_seconds || 0} seconds
                </div>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Category</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {session.category?.name || 'Practice Session'}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {questionCount} questions configured
                </div>
              </div>
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">Topics Practiced</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {selectedSubcategories.length > 0 ? selectedSubcategories.length : subcategoryStats.size} topics
                </div>
                {selectedSubcategories.length > 0 && selectedSubcategories.length <= 5 && (
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1 line-clamp-2">
                    {selectedSubcategories.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center">
          {weakAreas.length > 0 && (
            <Button
              onClick={handlePracticeWeakAreas}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base"
            >
              <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Practice Weak Areas
            </Button>
          )}
          <Button
            onClick={handlePracticeAgain}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base"
          >
            <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Practice Again
          </Button>
          <Button
            onClick={handleBackToDashboard}
            size="lg"
            className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base"
          >
            <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
