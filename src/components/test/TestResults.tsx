'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
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
  Eye,
  BarChart3,
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

// AI Insights Interface
interface AIInsight {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  studyPlan: string[]
  motivationalMessage: string
  nextSteps: string[]
}

// AI Insights Hook
function useAIInsights(performanceData: any) {
  const [insights, setInsights] = useState<AIInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    'https://rscxnpoffeedqfgynnct.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzY3hucG9mZmVlZHFmZ3lubmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTIzNDEsImV4cCI6MjA3NzQyODM0MX0.uhwKiVHLz-4zE_JnDgyAxPnL361nSXCFzZnIwH39UCE'
  )

  useEffect(() => {
    if (!performanceData || performanceData.topics?.length === 0) return

    const generateInsights = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log('🤖 Calling AI insights with data:', performanceData)
        
        const { data, error } = await supabase.functions.invoke('ai-insights', {
          body: { performanceData }
        })

        console.log('📡 Edge function response:', { data, error })

        if (error) {
          console.error('❌ Edge function error:', error)
          // Don't throw immediately, check if we got data anyway
          if (!data || !data.insights) {
            throw error
          }
        }
        
        if (data && data.insights) {
          console.log('✅ AI insights received:', data.insights)
          setInsights(data.insights)
          
          // Set error state if this was a fallback response
          if (data.fallback) {
            setError('Using fallback insights')
          }
        } else {
          console.error('❌ No insights in response:', data)
          throw new Error('No insights returned from AI service')
        }
        
      } catch (err) {
        console.error('❌ Failed to generate AI insights:', err)
        
        // More detailed error logging
        if (err instanceof Error) {
          console.error('Error name:', err.name)
          console.error('Error message:', err.message)
          console.error('Error stack:', err.stack)
        }
        
        setError(`AI service unavailable - using smart fallback`)
        
        // Fallback to static insights
        console.log('🔄 Using local fallback insights')
        setInsights(generateFallbackInsights(performanceData))
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to avoid immediate calls
    const timeoutId = setTimeout(generateInsights, 1000)
    return () => clearTimeout(timeoutId)
  }, [performanceData])

  return { insights, loading, error }
}

// Fallback insights function
function generateFallbackInsights(data: any): AIInsight {
  const bestTopic = data.topics?.reduce((max: any, topic: any) => 
    topic.accuracy > max.accuracy ? topic : max
  )
  const worstTopic = data.topics?.reduce((min: any, topic: any) => 
    topic.accuracy < min.accuracy ? topic : min
  )

  return {
    strengths: [
      bestTopic ? `Strong performance in ${bestTopic.name} (${bestTopic.accuracy.toFixed(1)}%)` : "Completed the test successfully",
      data.overallAccuracy > 70 ? "Good conceptual understanding" : "Consistent effort across topics"
    ],
    weaknesses: [
      worstTopic ? `Need improvement in ${worstTopic.name} (${worstTopic.accuracy.toFixed(1)}%)` : "Focus on building foundational concepts",
      "Time management could be optimized"
    ],
    recommendations: [
      worstTopic ? `Practice more ${worstTopic.name} questions` : "Review basic concepts thoroughly",
      "Analyze incorrect answers to understand patterns",
      "Take regular timed practice tests"
    ],
    studyPlan: [
      "Set aside 30 minutes daily for focused practice",
      "Focus on weak areas while maintaining strengths",
      "Track progress with weekly assessments"
    ],
    motivationalMessage: "Every mistake is a learning opportunity. Keep practicing and you'll see improvement!",
    nextSteps: [
      "Identify your top 2 weak areas",
      "Create a structured study schedule",
      "Find additional practice resources"
    ]
  }
}

// AI Insights Component
function AIInsightsCard({ performanceData }: { performanceData: any }) {
  const { insights, loading, error } = useAIInsights(performanceData)

  if (loading) {
    return (
      <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <h4 className="font-semibold text-foreground">Generating AI Insights...</h4>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-muted/50 rounded animate-pulse"></div>
          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="mt-6 space-y-4">
      {/* AI Badge */}
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
          🤖 AI-Powered Insights
        </Badge>
        {error && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            {error.includes('fallback') ? 'Smart Fallback' : 'Fallback Mode'}
          </Badge>
        )}
      </div>

      {/* Strengths */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800">
        <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Your Strengths
        </h4>
        <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
          {insights.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Areas for Improvement
        </h4>
        <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
          {insights.weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              {weakness}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          AI Recommendations
        </h4>
        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
          {insights.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Study Plan */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Personalized Study Plan
        </h4>
        <ol className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
          {insights.studyPlan.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-purple-500 mt-1 font-medium">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Motivational Message */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-200 dark:border-rose-800 text-center">
        <div className="text-2xl mb-2">🌟</div>
        <p className="text-rose-800 dark:text-rose-300 font-medium">
          {insights.motivationalMessage}
        </p>
      </div>

      {/* Next Steps */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border border-slate-200 dark:border-slate-800">
        <h4 className="font-semibold text-slate-800 dark:text-slate-300 mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Immediate Next Steps
        </h4>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {insights.nextSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-slate-500 mt-1">→</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
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
  const [animatedScore, setAnimatedScore] = useState(0)
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  // Calculate statistics
  const totalQuestions = attempt.total_questions
  const correctAnswers = attempt.correct_answers
  const scorePercentage = totalQuestions > 0 ? (attempt.score / test.total_marks) * 100 : 0

  // Counter animation effect
  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const scoreIncrement = attempt.score / steps
    const percentageIncrement = scorePercentage / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setAnimatedScore(Math.min(Math.round(scoreIncrement * currentStep), attempt.score))
      setAnimatedPercentage(Math.min(percentageIncrement * currentStep, scorePercentage))
      
      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [attempt.score, scorePercentage])
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  const timeInMinutes = Math.floor(attempt.time_taken_seconds / 60)
  const timeInSeconds = attempt.time_taken_seconds % 60

  // Group by categories for section-wise performance
  const categoryStats: Record<string, CategoryStats> = {}

  answers.forEach((answer) => {
    // Safely extract category name, handling nested relationships
    let categoryName = 'Other'
    // Handle both 'question' and 'questions' property names
    const question = answer.question || answer.questions
    if (question) {
      // Handle both 'subcategory' and 'subcategories' property names
      const subcategoryData = question.subcategory || question.subcategories
      if (subcategoryData) {
        const subcategory = Array.isArray(subcategoryData) ? subcategoryData[0] : subcategoryData
        if (subcategory && typeof subcategory === 'object' && !('cardinality' in subcategory)) {
          // Handle both 'category' and 'categories' property names
          const categoryData = subcategory.category || subcategory.categories
          if (categoryData) {
            const category = Array.isArray(categoryData) ? categoryData[0] : categoryData
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
    categoryStats[categoryName].timeTaken += answer.time_taken_seconds || 0

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
    const question = answer.question || answer.questions
    const subcategoryData = question?.subcategory || question?.subcategories
    const subcat = Array.isArray(subcategoryData) ? subcategoryData[0]?.name : subcategoryData?.name
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
    const question = answer.question || answer.questions
    const difficulty = question?.difficulty || 'medium'
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
    time: answer.time_taken_seconds || 0,
  }))

  // Performance comparison data
  const comparisonData = [
    { name: 'Your Score', score: scorePercentage },
    { name: 'Average', score: avgScore || 0 },
    { name: 'Top Score', score: topScore || 0 },
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
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">Test Results</h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-medium">{test.title}</p>
        </div>

        {/* Main Score Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-foreground">
              <div className="p-2 rounded-full bg-primary/10">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Interactive Score Display */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <div className={`text-center p-6 rounded-2xl relative overflow-hidden transition-all duration-500 ${
                  scorePercentage >= 80 
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 border-2 border-emerald-300 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:border-emerald-700'
                    : scorePercentage >= 60
                    ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-300 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-700'
                    : 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20'
                }`}>
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse"></div>
                  
                  {/* Celebration sparkles for high scores */}
                  {scorePercentage >= 80 && (
                    <>
                      <div className="absolute top-2 left-2 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                      <div className="absolute top-4 right-4 w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce"></div>
                      <div className="absolute bottom-2 right-2 w-1 h-1 bg-emerald-600 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                    </>
                  )}
                  
                  <div className="relative z-10">
                    <div className="text-sm font-medium text-primary mb-2">Total Score</div>
                    <div className="text-5xl sm:text-6xl font-bold text-primary mb-2 animate-in fade-in duration-1000 tabular-nums">
                      {animatedScore}
                    </div>
                    <div className="text-lg text-muted-foreground mb-2">
                      out of <span className="font-semibold text-foreground">{test.total_marks}</span> marks
                    </div>
                    <div className="text-2xl font-bold text-primary tabular-nums">
                      {animatedPercentage.toFixed(1)}%
                    </div>
                    {attempt.percentile && (
                      <Badge variant="secondary" className="mt-3 bg-primary/10 text-primary border-primary/20">
                        {attempt.percentile}th Percentile
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Circular Progress for Accuracy */}
              <div className="flex flex-col items-center justify-center p-6">
                <div className="relative w-32 h-32 mb-4">
                  {/* Background circle */}
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      className={accuracy >= 80 ? "text-emerald-500" : accuracy >= 60 ? "text-amber-500" : "text-red-500"}
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - accuracy / 100)}`}
                      style={{
                        transition: "stroke-dashoffset 2s ease-in-out",
                      }}
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${accuracy >= 80 ? "text-emerald-500" : accuracy >= 60 ? "text-amber-500" : "text-red-500"}`}>
                        {accuracy.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Questions Answered</div>
                  <div className="font-semibold text-foreground">
                    {correctAnswers} correct out of {totalQuestions}
                  </div>
                </div>
              </div>

              {/* Time Performance */}
              <div className="flex flex-col justify-center p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Time Taken</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {timeInMinutes}m {timeInSeconds}s
                </div>
                <div className="text-sm text-muted-foreground">
                  out of {test.duration_minutes} minutes
                </div>
                {/* Time efficiency indicator */}
                <div className="mt-2">
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(((attempt.time_taken_seconds / 60) / test.duration_minutes) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Ranking Display */}
              <div className="flex flex-col justify-center p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Your Rank</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {attempt.rank ? `#${attempt.rank}` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  out of {totalAttempts} test takers
                </div>
                {attempt.rank && totalAttempts && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">
                      Top {((attempt.rank / totalAttempts) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
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
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  Section-wise Performance
                </CardTitle>
                <CardDescription>Your performance across different topics</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {Object.values(categoryStats).map((cat, index) => (
                    <div 
                      key={cat.name} 
                      className="p-6 hover:bg-muted/30 transition-colors duration-200 border-b last:border-0"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Section Name */}
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              cat.accuracy >= 80 ? 'bg-emerald-500' :
                              cat.accuracy >= 60 ? 'bg-amber-500' :
                              cat.accuracy >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <h4 className="font-semibold text-foreground">{cat.name}</h4>
                              <p className="text-xs text-muted-foreground">{cat.attempted} questions</p>
                            </div>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="lg:col-span-6">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            {/* Correct */}
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-emerald-600">{cat.correct}</div>
                              <div className="text-xs text-muted-foreground">Correct</div>
                            </div>
                            {/* Incorrect */}
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-red-600">{cat.incorrect}</div>
                              <div className="text-xs text-muted-foreground">Incorrect</div>
                            </div>
                            {/* Time */}
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.floor(cat.timeTaken / 60)}:{String(cat.timeTaken % 60).padStart(2, '0')}
                              </div>
                              <div className="text-xs text-muted-foreground">Time</div>
                            </div>
                          </div>
                        </div>

                        {/* Accuracy Progress */}
                        <div className="lg:col-span-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Accuracy</span>
                              <Badge
                                variant="outline"
                                className={`${
                                  cat.accuracy >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  cat.accuracy >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  cat.accuracy >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {cat.accuracy.toFixed(1)}%
                              </Badge>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                  cat.accuracy >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                  cat.accuracy >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                  cat.accuracy >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                  'bg-gradient-to-r from-red-500 to-red-400'
                                }`}
                                style={{ 
                                  width: `${cat.accuracy}%`,
                                  animationDelay: `${index * 200}ms`
                                }}
                              ></div>
                            </div>
                            {/* Performance Indicator */}
                            <div className="text-xs text-center">
                              <span className={`font-medium ${
                                cat.accuracy >= 80 ? 'text-emerald-600' :
                                cat.accuracy >= 60 ? 'text-amber-600' :
                                cat.accuracy >= 40 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {cat.accuracy >= 80 ? 'Excellent' :
                                 cat.accuracy >= 60 ? 'Good' :
                                 cat.accuracy >= 40 ? 'Average' : 'Needs Improvement'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Footer */}
                <div className="p-4 bg-muted/20 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-primary">
                        {Object.values(categoryStats).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Sections</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-emerald-600">
                        {Object.values(categoryStats).reduce((sum, cat) => sum + cat.correct, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Correct</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-red-600">
                        {Object.values(categoryStats).reduce((sum, cat) => sum + cat.incorrect, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Incorrect</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.floor(Object.values(categoryStats).reduce((sum, cat) => sum + cat.timeTaken, 0) / 60)}m
                      </div>
                      <div className="text-xs text-muted-foreground">Total Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends Graph */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Question-wise Performance
                </CardTitle>
                <CardDescription>Your accuracy and time distribution across questions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Accuracy Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      Accuracy Distribution
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Correct', count: correctAnswers, color: 'bg-emerald-500', percentage: (correctAnswers / totalQuestions) * 100 },
                        { label: 'Incorrect', count: totalQuestions - correctAnswers, color: 'bg-red-500', percentage: ((totalQuestions - correctAnswers) / totalQuestions) * 100 }
                      ].map((item) => (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                              {item.label}
                            </span>
                            <span className="font-medium">{item.count} ({item.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-1000 ease-out ${item.color}`}
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Time Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {totalQuestions > 0 ? Math.round((attempt.time_taken_seconds / totalQuestions) * 10) / 10 : 0}s
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Avg per Question</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 rounded-lg bg-muted/20">
                          <div className="text-lg font-bold text-emerald-600">
                            {Math.round(((attempt.time_taken_seconds / 60) / test.duration_minutes) * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Time Used</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/20">
                          <div className="text-lg font-bold text-amber-600">
                            {Math.max(0, test.duration_minutes - Math.round(attempt.time_taken_seconds / 60))}m
                          </div>
                          <div className="text-xs text-muted-foreground">Time Left</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Performance Chart */}
                <div className="bg-card rounded-xl border p-4">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Question-wise Time Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={timeDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="question" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        label={{ value: 'Time (s)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}s`, 'Time Taken']}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="time" 
                        radius={[4, 4, 0, 0]}
                        fill="url(#timeGradient)"
                      >
                        <defs>
                          <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Insights */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {correctAnswers}
                        </div>
                        <div className="text-sm text-emerald-700 dark:text-emerald-300">Questions Correct</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/30 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {totalQuestions - correctAnswers}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">Questions Incorrect</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {timeInMinutes}:{String(timeInSeconds).padStart(2, '0')}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Total Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Comparison */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Performance Comparison
                </CardTitle>
                <CardDescription>How you performed against others</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      {scorePercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Your Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {attempt.score}/{test.total_marks} marks
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {avgScore ? avgScore.toFixed(1) : 'N/A'}%
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Average Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Class average
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                      {topScore ? topScore.toFixed(1) : 'N/A'}%
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">Top Score</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Highest in class
                    </div>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Performance Insights
                  </h4>
                  <div className="space-y-2 text-sm">
                    {avgScore && scorePercentage > avgScore ? (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        🎉 Great job! You scored {(scorePercentage - avgScore).toFixed(1)}% above the class average.
                      </p>
                    ) : avgScore && scorePercentage < avgScore ? (
                      <p className="text-blue-600 dark:text-blue-400">
                        📚 You scored {(avgScore - scorePercentage).toFixed(1)}% below the class average. Keep practicing!
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        📊 Your performance data is being analyzed.
                      </p>
                    )}
                    
                    {attempt.rank && totalAttempts && (
                      <p className="text-muted-foreground">
                        📊 You ranked #{attempt.rank} out of {totalAttempts} students (Top {((attempt.rank / totalAttempts) * 100).toFixed(1)}%).
                      </p>
                    )}
                    
                    <p className="text-muted-foreground">
                      ⏱️ {getTimeManagementInsight()}
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-card rounded-xl border p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === 'score' ? 'Score' : name]}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[8, 8, 0, 0]}
                        fill="url(#colorGradient)"
                      >
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Distribution */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <div className="text-lg font-bold text-foreground">
                      {totalAttempts || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Students</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <div className="text-lg font-bold text-emerald-600">
                      {Math.round(accuracy)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Your Accuracy</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <div className="text-lg font-bold text-blue-600">
                      {timeInMinutes}:{String(timeInSeconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Time Taken</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/20">
                    <div className="text-lg font-bold text-primary">
                      {correctAnswers}/{totalQuestions}
                    </div>
                    <div className="text-xs text-muted-foreground">Correct/Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {/* Topic-wise Accuracy */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Topic-wise Performance
                </CardTitle>
                <CardDescription>Your performance across different topics and subcategories</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {radarData.length >= 3 ? (
                  // Radar chart for 3+ topics
                  <div className="space-y-6">
                    <div className="text-center">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {radarData.length} Topics Analyzed
                      </Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--muted))" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <Radar
                          name="Accuracy"
                          dataKey="accuracy"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Tooltip 
                          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Accuracy']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : radarData.length > 0 ? (
                  // Card layout for 1-2 topics
                  <div className="space-y-6">
                    <div className="text-center">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {radarData.length} Topic{radarData.length > 1 ? 's' : ''} Available
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {radarData.length < 3 ? 'Limited topics - showing detailed breakdown' : ''}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {radarData.map((topic, index) => (
                        <div 
                          key={topic.subject}
                          className="p-6 rounded-xl bg-gradient-to-br from-card to-muted/20 border border-border/50 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-4 h-4 rounded-full ${
                              topic.accuracy >= 80 ? 'bg-emerald-500' :
                              topic.accuracy >= 60 ? 'bg-amber-500' :
                              topic.accuracy >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}></div>
                            <h3 className="font-semibold text-foreground">{topic.subject}</h3>
                          </div>
                          
                          {/* Circular Progress */}
                          <div className="flex items-center justify-center mb-4">
                            <div className="relative w-24 h-24">
                              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  className="text-muted/30"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeLinecap="round"
                                  className={
                                    topic.accuracy >= 80 ? "text-emerald-500" :
                                    topic.accuracy >= 60 ? "text-amber-500" :
                                    topic.accuracy >= 40 ? "text-orange-500" : "text-red-500"
                                  }
                                  strokeDasharray={`${2 * Math.PI * 40}`}
                                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - topic.accuracy / 100)}`}
                                  style={{
                                    transition: "stroke-dashoffset 2s ease-in-out",
                                    animationDelay: `${index * 500}ms`
                                  }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${
                                    topic.accuracy >= 80 ? "text-emerald-500" :
                                    topic.accuracy >= 60 ? "text-amber-500" :
                                    topic.accuracy >= 40 ? "text-orange-500" : "text-red-500"
                                  }`}>
                                    {topic.accuracy.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Performance Label */}
                          <div className="text-center">
                            <Badge 
                              variant="outline"
                              className={`${
                                topic.accuracy >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                topic.accuracy >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                topic.accuracy >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {topic.accuracy >= 80 ? 'Excellent' :
                               topic.accuracy >= 60 ? 'Good' :
                               topic.accuracy >= 40 ? 'Average' : 'Needs Work'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* AI-Powered Insights */}
                    <AIInsightsCard 
                      performanceData={{
                        topics: radarData.map(topic => ({
                          name: topic.subject,
                          accuracy: topic.accuracy,
                          timeSpent: Math.round(attempt.time_taken_seconds / totalQuestions),
                          questionsAttempted: Math.round(totalQuestions / radarData.length),
                          questionsCorrect: Math.round((topic.accuracy / 100) * (totalQuestions / radarData.length))
                        })),
                        overallAccuracy: accuracy,
                        totalTime: attempt.time_taken_seconds,
                        testDuration: test.duration_minutes * 60,
                        testTitle: test.title,
                        studentLevel: scorePercentage >= 80 ? 'advanced' : scorePercentage >= 60 ? 'intermediate' : 'beginner'
                      }}
                    />
                  </div>
                ) : (
                  // No topic data available
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Topic Data Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Topic-wise analysis requires categorized questions. This test may not have topic classifications.
                    </p>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Try Categorized Tests
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

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
              <CardContent className="space-y-3">
                {filteredAnswers.map((answer, index) => {
                  const question = answer.question || answer.questions
                  const isExpanded = expandedQuestions.has(answer.id)

                  return (
                    <Card key={answer.id} className="bg-white dark:bg-card border-0 shadow-sm rounded-2xl overflow-hidden">
                      {/* Question Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary font-semibold text-xs px-2 py-1">
                            Q{answers.findIndex((a) => a.id === answer.id) + 1}
                          </Badge>
                          <Badge variant="secondary" className="bg-muted/50 text-xs px-2 py-1">
                            {(() => {
                              // Extract topic/subcategory name
                              if (!question?.subcategory && !question?.subcategories) return 'Other'
                              
                              // Handle both 'subcategory' and 'subcategories' property names
                              const subcategoryData = question.subcategory || question.subcategories
                              const subcategory = Array.isArray(subcategoryData) ? subcategoryData[0] : subcategoryData
                              
                              // If subcategory has a name, use it (this is the topic)
                              if (subcategory && typeof subcategory === 'object' && subcategory.name && !('cardinality' in subcategory)) {
                                return String(subcategory.name)
                              }
                              
                              // Fallback to category name if subcategory name not available
                              if (subcategory && subcategory.category) {
                                const categoryData = subcategory.category || subcategory.categories
                                const category = Array.isArray(categoryData) ? categoryData[0] : categoryData
                                if (category && typeof category === 'object' && category.name && !('cardinality' in category)) {
                                  return String(category.name)
                                }
                              }
                              
                              return 'Other'
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
                            className={`text-xs px-2 py-1 ${
                              question?.difficulty === 'easy'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : question?.difficulty === 'hard'
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-amber-100 text-amber-700 border-amber-300'
                            }`}
                          >
                            {question?.difficulty}
                          </Badge>
                        </div>
                        
                        {/* Question Text */}
                        <h3 className="text-lg font-medium text-foreground leading-relaxed mb-6">
                          {question?.['question text'] || question?.question_text}
                        </h3>
                      </div>

                      {/* Options Display */}
                      <div className="px-6 space-y-2">
                        {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                          const optionText = question?.[`option ${letter.toLowerCase()}`] || question?.[`option_${letter.toLowerCase()}`]
                          if (!optionText) return null

                          const isSelected = answer.user_answer === letter
                          
                          // Check if this option is correct - handle both text and letter formats
                          const correctAnswerText = question?.['correct answer'] || question?.correct_answer
                          let isCorrect = false
                          
                          if (correctAnswerText) {
                            // If correct answer is a letter (A, B, C, D, E)
                            if (['A', 'B', 'C', 'D', 'E'].includes(correctAnswerText.toUpperCase())) {
                              isCorrect = letter === correctAnswerText.toUpperCase()
                            } else {
                              // If correct answer is the full option text
                              isCorrect = correctAnswerText === optionText
                            }
                          }
                          
                          // Style based on correctness - matching the reference image
                          let containerStyle = 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                          let letterStyle = 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          let showLabels = false

                          if (isCorrect) {
                            // Green styling for correct answer (always show green for correct answers)
                            containerStyle = 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-600'
                            letterStyle = 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            showLabels = true // Always show labels for correct answers
                          } else if (isSelected && !isCorrect) {
                            // Red styling for incorrect selection
                            containerStyle = 'bg-red-50 border-red-400 dark:bg-red-950/30 dark:border-red-600'
                            letterStyle = 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            showLabels = true
                          }

                          return (
                            <div
                              key={letter}
                              className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${containerStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm border ${letterStyle} border-gray-300 dark:border-gray-600`}>
                                  {letter}
                                </div>
                                <span className="flex-1 text-sm sm:text-base text-gray-800 dark:text-gray-200">
                                  {optionText}
                                </span>
                                
                                {/* Checkmark for correct answers */}
                                {isCorrect && (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Labels for selected options */}
                              {showLabels && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {isSelected && (
                                    <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${
                                      isCorrect 
                                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                                    }`}>
                                      Your Answer
                                    </span>
                                  )}
                                  {isCorrect && (
                                    <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-full">
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Explanation Section */}
                      <div className="p-6 pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleQuestion(answer.id)}
                          className="w-full justify-start text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-auto font-medium"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {isExpanded ? 'Hide Explanation' : 'Show Explanation'}
                        </Button>

                        {isExpanded && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-primary">
                            <h4 className="font-semibold text-foreground mb-3">Explanation:</h4>
                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                              {question?.explanation}
                            </div>
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <span>Time: {(() => {
                            const seconds = answer.time_taken_seconds || 0
                            if (seconds < 60) {
                              return `${seconds}s`
                            } else {
                              const minutes = Math.floor(seconds / 60)
                              const remainingSeconds = seconds % 60
                              return `${minutes}m ${remainingSeconds}s`
                            }
                          })()}</span>
                          <span>Marks: {answer.marks_obtained}/{question?.marks}</span>
                        </div>
                      </div>
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

