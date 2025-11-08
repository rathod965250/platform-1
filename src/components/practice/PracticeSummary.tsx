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
  sessionSummary: any | null
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
  strongAreas: Array<{
    topic: string
    correctCount: number
    incorrectCount: number
    totalAttempted: number
    accuracy: number
    confidenceScore: number
  }>
  performanceAnalysis: Array<{
    subcategoryId: string | null
    subcategoryName: string
    topicName: string | null
    totalQuestions: number
    attemptedQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedQuestions: number
    accuracy: number
    errorRate: number
    totalTime: number
    avgTime: number
    easyTotal: number
    easyCorrect: number
    mediumTotal: number
    mediumCorrect: number
    hardTotal: number
    hardCorrect: number
    isStrongArea: boolean
    isWeakArea: boolean
    confidenceScore: number
  }>
  topicMasteryData: any[]
  attemptedCount: number
  notAttemptedCount: number
  skippedCount: number
  incorrectCount: number
  correctCount: number
  markedCount: number
  finalMastery: number
  startingMastery: number
  masteryChange: number
}

export function PracticeSummary({
  session,
  sessionStats,
  sessionSummary,
  metrics,
  recommendations,
  categoryId,
  weakAreas,
  strongAreas,
  performanceAnalysis,
  topicMasteryData,
  attemptedCount,
  notAttemptedCount,
  skippedCount,
  incorrectCount,
  correctCount,
  markedCount,
  finalMastery,
  startingMastery,
  masteryChange,
}: PracticeSummaryProps) {
  const router = useRouter()
  const [showQuestionReview, setShowQuestionReview] = useState(false)
  const [showPerformanceBreakdown, setShowPerformanceBreakdown] = useState(true)
  const [showMasteryChart, setShowMasteryChart] = useState(false)
  const [showPerformanceTrends, setShowPerformanceTrends] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 20

  const totalQuestions = session.total_questions || metrics.length || 0
  
  // Use sessionSummary data if available (most accurate from Enhanced End Session Dialog)
  const finalAttemptedCount = sessionSummary?.attempted_count ?? attemptedCount
  const finalCorrectCount = sessionSummary?.correct_count ?? correctCount
  const finalIncorrectCount = sessionSummary?.incorrect_count ?? incorrectCount
  const finalSkippedCount = sessionSummary?.skipped_count ?? skippedCount
  const finalNotAttemptedCount = sessionSummary?.unanswered_count ?? notAttemptedCount
  const finalMarkedCount = sessionSummary?.marked_count ?? markedCount
  
  // Debug logging
  console.log('=== PRACTICE SUMMARY DATA SOURCE ===')
  console.log('Using sessionSummary:', !!sessionSummary)
  console.log('sessionSummary data:', sessionSummary)
  console.log('Fallback data:', { attemptedCount, correctCount, incorrectCount, skippedCount, notAttemptedCount, markedCount })
  console.log('Final counts:', { 
    finalAttemptedCount, 
    finalCorrectCount, 
    finalIncorrectCount, 
    finalSkippedCount, 
    finalNotAttemptedCount,
    finalMarkedCount,
    totalQuestions 
  })
  
  // Calculate accuracy based on attempted questions, not total questions
  const accuracy = finalAttemptedCount > 0 ? (finalCorrectCount / finalAttemptedCount) * 100 : 0
  
  // Use sessionSummary time data if available, otherwise fallback to session or sessionStats
  const totalTimeSeconds = sessionSummary?.total_time_seconds 
    ?? session.time_taken_seconds 
    ?? sessionStats?.session_duration_seconds 
    ?? 0
  const timeInMinutes = Math.floor(totalTimeSeconds / 60)
  const timeInSeconds = totalTimeSeconds % 60

  const improvementRate = sessionStats?.improvement_rate || 0
  // Calculate comprehensive time statistics
  const timeStats = {
    total: 0,
    min: Infinity,
    max: 0,
    avg: 0,
    attempted: 0,
  }

  metrics.forEach((metric: any) => {
    if (metric.is_correct !== null && metric.is_correct !== undefined && metric.time_taken_seconds) {
      const time = metric.time_taken_seconds
      timeStats.total += time
      timeStats.min = Math.min(timeStats.min, time)
      timeStats.max = Math.max(timeStats.max, time)
      timeStats.attempted += 1
    }
  })

  timeStats.avg = timeStats.attempted > 0 ? Math.round(timeStats.total / timeStats.attempted) : 0
  if (timeStats.min === Infinity) timeStats.min = 0
  
  const avgTime = sessionStats?.avg_time_seconds || timeStats.avg

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

  // Calculate difficulty breakdown - prioritize sessionSummary data if available
  const difficultyStats = {
    easy: { 
      total: sessionSummary?.easy_total ?? 0, 
      correct: sessionSummary?.easy_correct ?? 0, 
      attempted: 0 // Will be calculated below
    },
    medium: { 
      total: sessionSummary?.medium_total ?? 0, 
      correct: sessionSummary?.medium_correct ?? 0, 
      attempted: 0 
    },
    hard: { 
      total: sessionSummary?.hard_total ?? 0, 
      correct: sessionSummary?.hard_correct ?? 0, 
      attempted: 0 
    },
  }

  // If sessionSummary doesn't have data, calculate from metrics
  if (!sessionSummary) {
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
  }
  
  // Calculate attempted count for each difficulty
  // For sessionSummary data: attempted = correct / (accuracy / 100)
  // For example: if correct = 8 and accuracy = 80%, then attempted = 8 / 0.8 = 10
  if (sessionSummary) {
    difficultyStats.easy.attempted = sessionSummary.easy_accuracy && sessionSummary.easy_accuracy > 0
      ? Math.round(sessionSummary.easy_correct / (sessionSummary.easy_accuracy / 100))
      : 0
    difficultyStats.medium.attempted = sessionSummary.medium_accuracy && sessionSummary.medium_accuracy > 0
      ? Math.round(sessionSummary.medium_correct / (sessionSummary.medium_accuracy / 100))
      : 0
    difficultyStats.hard.attempted = sessionSummary.hard_accuracy && sessionSummary.hard_accuracy > 0
      ? Math.round(sessionSummary.hard_correct / (sessionSummary.hard_accuracy / 100))
      : 0
  }
  
  // Debug logging for difficulty breakdown
  console.log('=== DIFFICULTY BREAKDOWN ===')
  console.log('Using sessionSummary for difficulty:', !!sessionSummary)
  console.log('Difficulty stats:', difficultyStats)

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
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-chart-2/10 dark:from-primary/20 dark:via-accent/20 dark:to-chart-2/20 border-2 border-primary/30 dark:border-primary/40 shadow-2xl hover:shadow-primary/20 transition-all duration-300">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"></div>
          
          <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 relative z-10">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-full bg-primary/10 dark:bg-primary/20 ring-4 ring-primary/20 dark:ring-primary/30">
                  <Trophy className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary animate-pulse" />
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
                  Practice Session Complete!
                </h1>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border border-primary/20 dark:border-primary/30 mb-3">
                <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold ${achievement.color}`}>
                  {achievement.message}
                </p>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
                {session.category?.name || 'Practice Session'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {/* Accuracy */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-xl bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 ${getAccuracyColor()} group-hover:scale-110 transition-transform duration-300`}>
                  {accuracy.toFixed(1)}%
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Accuracy</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {finalCorrectCount} / {finalAttemptedCount > 0 ? finalAttemptedCount : totalQuestions} correct
                </div>
              </div>

              {/* Time */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-xl bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm border-2 border-border/50 hover:border-chart-2/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="inline-flex p-2 rounded-full bg-chart-2/10 dark:bg-chart-2/20 mb-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-chart-2 group-hover:animate-spin" />
                </div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                  {timeInMinutes > 0 ? `${timeInMinutes}m ${timeInSeconds}s` : `${totalTimeSeconds}s`}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Time Taken</div>
              </div>

              {/* Mastery Score */}
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-xl bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm border-2 border-border/50 hover:border-chart-1/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="inline-flex p-2 rounded-full bg-chart-1/10 dark:bg-chart-1/20 mb-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-chart-1 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                  {(finalMastery * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Mastery Score</div>
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
              <div className="text-center p-3 sm:p-4 md:p-5 rounded-xl bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm border-2 border-border/50 hover:border-accent/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="inline-flex p-2 rounded-full bg-accent/10 dark:bg-accent/20 mb-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-accent-foreground group-hover:translate-y-[-2px] transition-transform duration-300" />
                </div>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                  {improvementRate >= 0 ? '+' : ''}
                  {improvementRate.toFixed(1)}%
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Improvement</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Statistics Section */}
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 border-2 border-border/50 hover:border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-muted/10">
          <CardHeader className="pb-2 sm:pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-foreground">Session Statistics</CardTitle>
            </div>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium mt-1">
              Comprehensive breakdown of your practice session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-chart-1/30 bg-gradient-to-br from-chart-1/5 to-chart-1/10 dark:from-chart-1/10 dark:to-chart-1/20 hover:shadow-lg transition-all duration-300 group">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-chart-1 mb-0.5 sm:mb-1">
                  {finalAttemptedCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Attempted</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {totalQuestions > 0 ? ((finalAttemptedCount / totalQuestions) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-border/50 bg-gradient-to-br from-muted/20 to-muted/30 hover:shadow-lg transition-all duration-300 group">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground mb-0.5 sm:mb-1 group-hover:scale-110 transition-transform duration-300">
                  {finalNotAttemptedCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Not Attempted</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {totalQuestions > 0 ? ((finalNotAttemptedCount / totalQuestions) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-chart-3/30 bg-gradient-to-br from-chart-3/5 to-chart-3/10 dark:from-chart-3/10 dark:to-chart-3/20 hover:shadow-lg transition-all duration-300 group">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-chart-3 mb-0.5 sm:mb-1 group-hover:scale-110 transition-transform duration-300">
                  {finalSkippedCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Skipped</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {totalQuestions > 0 ? ((finalSkippedCount / totalQuestions) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-chart-1/40 bg-gradient-to-br from-chart-1/10 to-chart-1/20 dark:from-chart-1/20 dark:to-chart-1/30 shadow-md hover:shadow-lg transition-all duration-300 group">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-chart-1 mb-0.5 sm:mb-1">
                  {finalCorrectCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-chart-1 font-bold uppercase tracking-wide">Correct</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {finalAttemptedCount > 0 ? ((finalCorrectCount / finalAttemptedCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-destructive/40 bg-gradient-to-br from-destructive/10 to-destructive/20 dark:from-destructive/20 dark:to-destructive/30 shadow-md hover:shadow-lg transition-all duration-300 group">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-destructive mb-0.5 sm:mb-1 group-hover:scale-110 transition-transform duration-300">
                  {finalIncorrectCount}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-destructive font-bold uppercase tracking-wide">Incorrect</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5">
                  {finalAttemptedCount > 0 ? ((finalIncorrectCount / finalAttemptedCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center p-2.5 sm:p-3 md:p-4 rounded-xl border-2 border-chart-2/30 bg-gradient-to-br from-chart-2/5 to-chart-2/10 dark:from-chart-2/10 dark:to-chart-2/20 hover:shadow-lg transition-all duration-300 group">
                <div className="inline-flex p-1.5 rounded-full bg-chart-2/20 dark:bg-chart-2/30 mb-1">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-chart-2" />
                </div>
                <div className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">
                  {sessionSummary?.avg_time_per_question ?? avgTime}s
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Avg Time</div>
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
                  {recommendations.slice(0, 3).map((rec: any, index: number) => {
                    // Determine icon and color based on type
                    const typeConfig = {
                      practice: {
                        icon: '📚',
                        bgClass: 'bg-blue-50 dark:bg-blue-950/20',
                        borderClass: 'border-blue-200 dark:border-blue-800',
                        badgeClass: 'bg-blue-500 text-white'
                      },
                      improve: {
                        icon: '📈',
                        bgClass: 'bg-green-50 dark:bg-green-950/20',
                        borderClass: 'border-green-200 dark:border-green-800',
                        badgeClass: 'bg-green-500 text-white'
                      },
                      maintain: {
                        icon: '⭐',
                        bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
                        borderClass: 'border-yellow-200 dark:border-yellow-800',
                        badgeClass: 'bg-yellow-500 text-white'
                      },
                      review: {
                        icon: '🔄',
                        bgClass: 'bg-purple-50 dark:bg-purple-950/20',
                        borderClass: 'border-purple-200 dark:border-purple-800',
                        badgeClass: 'bg-purple-500 text-white'
                      }
                    }
                    
                    const config = typeConfig[rec.type as keyof typeof typeConfig] || typeConfig.practice
                    
                    return (
                      <div
                        key={index}
                        className={`p-2.5 sm:p-3 md:p-4 rounded-lg border ${config.borderClass} ${config.bgClass} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-lg sm:text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-xs sm:text-sm md:text-base text-foreground">
                                {rec.title}
                              </div>
                              {rec.type && (
                                <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.badgeClass}`}>
                                  {rec.type.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              {rec.description}
                            </div>
                            {rec.topic && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Topic:</span>
                                <span className="text-[9px] sm:text-[10px] font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                                  {rec.topic}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                  <span className="text-muted-foreground">Correct ({finalCorrectCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-destructive bg-destructive"></div>
                  <span className="text-muted-foreground">Incorrect ({finalIncorrectCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-2 border-border bg-muted"></div>
                  <span className="text-muted-foreground">Not Attempted ({finalNotAttemptedCount})</span>
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
                    
                    // Define colors for each difficulty
                    const difficultyColors = {
                      easy: {
                        badge: 'bg-green-500 text-white border-green-600 dark:bg-green-600 dark:border-green-700',
                        card: 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent hover:from-green-50 dark:hover:from-green-950/30',
                        progress: 'bg-green-500/20 dark:bg-green-500/30',
                        progressBar: '[&>div]:bg-green-500 dark:[&>div]:bg-green-400',
                        text: 'text-green-700 dark:text-green-400'
                      },
                      medium: {
                        badge: 'bg-purple-500 text-white border-purple-600 dark:bg-purple-600 dark:border-purple-700',
                        card: 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent hover:from-purple-50 dark:hover:from-purple-950/30',
                        progress: 'bg-purple-500/20 dark:bg-purple-500/30',
                        progressBar: '[&>div]:bg-purple-500 dark:[&>div]:bg-purple-400',
                        text: 'text-purple-700 dark:text-purple-400'
                      },
                      hard: {
                        badge: 'bg-red-500 text-white border-red-600 dark:bg-red-600 dark:border-red-700',
                        card: 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent hover:from-red-50 dark:hover:from-red-950/30',
                        progress: 'bg-red-500/20 dark:bg-red-500/30',
                        progressBar: '[&>div]:bg-red-500 dark:[&>div]:bg-red-400',
                        text: 'text-red-700 dark:text-red-400'
                      }
                    }
                    
                    const colors = difficultyColors[diff]
                    
                    return (
                      <div 
                        key={diff} 
                        className={`p-2.5 sm:p-3 md:p-4 rounded-lg border transition-all duration-300 ${colors.card} group cursor-default`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5 sm:mb-2">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Badge
                              className={`capitalize text-[9px] sm:text-[10px] md:text-xs px-2 py-0.5 font-semibold ${colors.badge}`}
                            >
                              {diff}
                            </Badge>
                            <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground">
                              {stats.correct}/{stats.total}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              Avg Time: <span className="font-semibold">{timeStats.avg}s</span>
                            </span>
                            <span className={`text-xs sm:text-sm md:text-base font-bold ${colors.text}`}>
                              {accuracy.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={accuracy} 
                          className={`h-2 sm:h-2.5 ${colors.progress} ${colors.progressBar} transition-all duration-500`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Interactive Stacked Bar Chart */}
              <div className="p-3 sm:p-4 rounded-xl border border-border bg-gradient-to-br from-card to-muted/20">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full"></span>
                  Difficulty Distribution Chart
                </h3>
                
                {/* Interactive Stacked Bar Chart */}
                <div className="h-[280px] sm:h-[320px] md:h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { 
                          name: 'Easy', 
                          correct: difficultyStats.easy.correct,
                          incorrect: difficultyStats.easy.attempted - difficultyStats.easy.correct,
                          unattempted: difficultyStats.easy.total - difficultyStats.easy.attempted,
                          total: difficultyStats.easy.total,
                          accuracy: difficultyStats.easy.attempted > 0 ? ((difficultyStats.easy.correct / difficultyStats.easy.attempted) * 100).toFixed(1) : 0
                        },
                        { 
                          name: 'Medium', 
                          correct: difficultyStats.medium.correct,
                          incorrect: difficultyStats.medium.attempted - difficultyStats.medium.correct,
                          unattempted: difficultyStats.medium.total - difficultyStats.medium.attempted,
                          total: difficultyStats.medium.total,
                          accuracy: difficultyStats.medium.attempted > 0 ? ((difficultyStats.medium.correct / difficultyStats.medium.attempted) * 100).toFixed(1) : 0
                        },
                        { 
                          name: 'Hard', 
                          correct: difficultyStats.hard.correct,
                          incorrect: difficultyStats.hard.attempted - difficultyStats.hard.correct,
                          unattempted: difficultyStats.hard.total - difficultyStats.hard.attempted,
                          total: difficultyStats.hard.total,
                          accuracy: difficultyStats.hard.attempted > 0 ? ((difficultyStats.hard.correct / difficultyStats.hard.attempted) * 100).toFixed(1) : 0
                        },
                      ]}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                      barSize={50}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="hsl(var(--border))" 
                        opacity={0.2}
                        horizontal={false}
                      />
                      <XAxis 
                        type="number"
                        stroke="hsl(var(--muted-foreground))" 
                        style={{ fontSize: '11px' }} 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                        label={{ 
                          value: 'Number of Questions', 
                          position: 'insideBottom', 
                          offset: -5,
                          style: { fontSize: '11px', fill: 'hsl(var(--muted-foreground))', fontWeight: 600 } 
                        }}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name" 
                        stroke="hsl(var(--foreground))" 
                        style={{ fontSize: '13px', fontWeight: 600 }} 
                        tick={{ fill: 'hsl(var(--foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                          padding: '12px 16px',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                        }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-card border-2 border-border rounded-xl p-3 shadow-lg">
                                <p className="font-bold text-foreground mb-2 text-sm">{data.name} Questions</p>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded bg-green-500"></div>
                                      <span className="text-muted-foreground">Correct:</span>
                                    </div>
                                    <span className="font-bold text-green-600 dark:text-green-400">{data.correct}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded bg-red-500"></div>
                                      <span className="text-muted-foreground">Incorrect:</span>
                                    </div>
                                    <span className="font-bold text-red-600 dark:text-red-400">{data.incorrect}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded bg-gray-400"></div>
                                      <span className="text-muted-foreground">Unattempted:</span>
                                    </div>
                                    <span className="font-bold text-muted-foreground">{data.unattempted}</span>
                                  </div>
                                  <div className="pt-2 mt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-muted-foreground">Total:</span>
                                      <span className="font-bold text-foreground">{data.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-muted-foreground">Accuracy:</span>
                                      <span className={`font-bold ${
                                        data.accuracy >= 70 ? 'text-green-600 dark:text-green-400' :
                                        data.accuracy >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                        'text-red-600 dark:text-red-400'
                                      }`}>{data.accuracy}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontSize: '12px', 
                          paddingTop: '15px',
                          fontWeight: 500
                        }}
                        iconType="square"
                        iconSize={12}
                      />
                      {/* Stacked Bars */}
                      <Bar 
                        dataKey="correct" 
                        stackId="a"
                        name="Correct"
                        fill="#22c55e"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar 
                        dataKey="incorrect" 
                        stackId="a"
                        name="Incorrect"
                        fill="#ef4444"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar 
                        dataKey="unattempted" 
                        stackId="a"
                        name="Unattempted"
                        fill="#9ca3af"
                        radius={[0, 4, 4, 0]}
                        opacity={0.6}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Summary Cards */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">Total</span>
                      <span className="text-lg sm:text-xl font-bold text-foreground">
                        {difficultyStats.easy.total + difficultyStats.medium.total + difficultyStats.hard.total}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">Correct</span>
                      <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                        {difficultyStats.easy.correct + difficultyStats.medium.correct + difficultyStats.hard.correct}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">Incorrect</span>
                      <span className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                        {(difficultyStats.easy.attempted - difficultyStats.easy.correct) + 
                         (difficultyStats.medium.attempted - difficultyStats.medium.correct) + 
                         (difficultyStats.hard.attempted - difficultyStats.hard.correct)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">Skipped</span>
                      <span className="text-lg sm:text-xl font-bold text-muted-foreground">
                        {(difficultyStats.easy.total - difficultyStats.easy.attempted) + 
                         (difficultyStats.medium.total - difficultyStats.medium.attempted) + 
                         (difficultyStats.hard.total - difficultyStats.hard.attempted)}
                      </span>
                    </div>
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

        {/* Weak & Strong Areas Analysis */}
        {(weakAreas.length > 0 || strongAreas.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            {/* Weak Areas - Areas for Improvement */}
            {weakAreas.length > 0 && (
              <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    Topics where you need more practice (accuracy &lt; 50%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {weakAreas.map((area, index) => (
                    <div
                      key={index}
                      className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-destructive/30 bg-card hover:bg-destructive/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm md:text-base font-semibold text-foreground truncate">
                            {area.topic}
                          </h4>
                          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">
                            {area.correctCount}/{area.totalAttempted} correct
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-[10px] sm:text-xs flex-shrink-0">
                          {area.accuracy.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={area.accuracy} className="h-1.5 sm:h-2 mb-2" />
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-destructive" />
                          {area.incorrectCount} incorrect
                        </span>
                        <span className="text-destructive font-medium">
                          {area.errorPercentage.toFixed(1)}% of total errors
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handlePracticeWeakAreas}
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2 text-xs sm:text-sm"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                    Practice These Topics
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Strong Areas - Your Strengths */}
            {strongAreas.length > 0 && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    Your Strengths
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    Topics where you excel (accuracy ≥ 80%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {strongAreas.map((area, index) => (
                    <div
                      key={index}
                      className="p-2.5 sm:p-3 md:p-4 rounded-lg border border-green-200 dark:border-green-800 bg-card hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm md:text-base font-semibold text-foreground truncate">
                            {area.topic}
                          </h4>
                          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">
                            {area.correctCount}/{area.totalAttempted} correct
                          </p>
                        </div>
                        <Badge className="bg-green-600 hover:bg-green-700 text-[10px] sm:text-xs flex-shrink-0">
                          {area.accuracy.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={area.accuracy} className="h-1.5 sm:h-2 mb-2" />
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {area.correctCount} correct
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          Confidence: {(area.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-[10px] sm:text-xs md:text-sm text-green-700 dark:text-green-300 flex items-center gap-1.5">
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                      Great job! Keep practicing to maintain your strengths.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Topic Mastery Map - Eye-Catching Granular Insights */}
        {topicMasteryData.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Topic Mastery Map
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Your mastery level for each specific problem type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {topicMasteryData.map((topic: any, index: number) => {
                  const masteryColor = 
                    topic.mastery_level === 'master' ? 'from-purple-500 to-purple-700' :
                    topic.mastery_level === 'expert' ? 'from-blue-500 to-blue-700' :
                    topic.mastery_level === 'advanced' ? 'from-green-500 to-green-700' :
                    topic.mastery_level === 'intermediate' ? 'from-yellow-500 to-yellow-700' :
                    'from-gray-400 to-gray-600'
                  
                  const masteryIcon = 
                    topic.mastery_level === 'master' ? '👑' :
                    topic.mastery_level === 'expert' ? '🏆' :
                    topic.mastery_level === 'advanced' ? '⭐' :
                    topic.mastery_level === 'intermediate' ? '📈' :
                    '🌱'
                  
                  const masteryLabel = 
                    topic.mastery_level === 'master' ? 'MASTER' :
                    topic.mastery_level === 'expert' ? 'EXPERT' :
                    topic.mastery_level === 'advanced' ? 'ADVANCED' :
                    topic.mastery_level === 'intermediate' ? 'INTERMEDIATE' :
                    'BEGINNER'
                  
                  return (
                    <div
                      key={index}
                      className="relative p-3 sm:p-4 rounded-xl border-2 border-border bg-card hover:shadow-lg transition-all duration-300 overflow-hidden group"
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${masteryColor} opacity-5 group-hover:opacity-10 transition-opacity`} />
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* Header with Mastery Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm md:text-base font-bold text-foreground line-clamp-2">
                              {topic.topic_name}
                            </h4>
                            {topic.topic_type && (
                              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5">
                                {topic.topic_type}
                              </p>
                            )}
                          </div>
                          <div className={`flex-shrink-0 px-2 py-1 rounded-full bg-gradient-to-r ${masteryColor} text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-1`}>
                            <span>{masteryIcon}</span>
                            <span>{masteryLabel}</span>
                          </div>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-muted/50">
                            <div className="text-xs sm:text-sm md:text-base font-bold text-foreground">
                              {topic.accuracy_percentage.toFixed(0)}%
                            </div>
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">Accuracy</div>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-muted/50">
                            <div className="text-xs sm:text-sm md:text-base font-bold text-foreground">
                              {topic.attempted_questions}
                            </div>
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">Attempts</div>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-muted/50">
                            <div className="text-xs sm:text-sm md:text-base font-bold text-foreground">
                              {topic.mastery_score.toFixed(0)}
                            </div>
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">Score</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-2">
                          <Progress value={topic.mastery_score} className="h-2" />
                        </div>
                        
                        {/* Additional Stats */}
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {topic.correct_answers} correct
                          </span>
                          {topic.longest_streak > 0 && (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              {topic.longest_streak} streak
                            </span>
                          )}
                          {topic.best_time_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-500" />
                              {topic.best_time_seconds}s best
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Mastery Legend */}
              <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Mastery Levels</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                    <span>🌱</span>
                    <span className="text-muted-foreground">Beginner (&lt;3 attempts)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                    <span>📈</span>
                    <span className="text-muted-foreground">Intermediate (75%+)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                    <span>⭐</span>
                    <span className="text-muted-foreground">Advanced (85%+)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                    <span>🏆</span>
                    <span className="text-muted-foreground">Expert (92%+)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                    <span>👑</span>
                    <span className="text-muted-foreground">Master (98%+)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
        <Card className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 border-2 border-border/50 hover:border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-muted/10">
          <CardHeader className="pb-2 sm:pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-foreground">Session Information</CardTitle>
            </div>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium mt-1">
              Details about this practice session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-gradient-to-br from-muted/20 to-muted/30 border border-border/50 hover:shadow-md transition-all duration-300">
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Session Date</div>
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
              <div className="p-3 rounded-lg bg-gradient-to-br from-chart-2/5 to-chart-2/10 dark:from-chart-2/10 dark:to-chart-2/20 border border-chart-2/30 hover:shadow-md transition-all duration-300">
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Duration</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {timeInMinutes} minutes
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {session.time_taken_seconds || sessionStats?.session_duration_seconds || 0} seconds
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/30 hover:shadow-md transition-all duration-300">
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Category</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {session.category?.name || 'Practice Session'}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                  {questionCount} questions configured
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/20 border border-accent/30 hover:shadow-md transition-all duration-300">
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Topics Practiced</div>
                <div className="font-medium text-foreground text-xs sm:text-sm md:text-base">
                  {subcategoryStats.size} {subcategoryStats.size === 1 ? 'topic' : 'topics'}
                </div>
                {subcategoryStats.size > 0 && subcategoryStats.size <= 5 && (
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1 line-clamp-2">
                    {Array.from(subcategoryStats.keys()).join(', ')}
                  </div>
                )}
                {subcategoryStats.size > 5 && (
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1">
                    {Array.from(subcategoryStats.keys()).slice(0, 3).join(', ')} +{subcategoryStats.size - 3} more
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
