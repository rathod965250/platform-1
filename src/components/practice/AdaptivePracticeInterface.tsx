'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  Home,
  Loader2,
} from 'lucide-react'
import { QuestionDisplay } from '@/components/test/QuestionDisplay'
import { AdaptiveQuestion, AdaptiveAnalytics } from '@/types/adaptive'

interface AdaptivePracticeInterfaceProps {
  category: any
  sessionId: string
  selectedSubcategories: string[]
  subcategories: Array<{ id: string; name: string }>
}

export function AdaptivePracticeInterface({
  category,
  sessionId,
  selectedSubcategories,
  subcategories,
}: AdaptivePracticeInterfaceProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AdaptiveAnalytics>({
    mastery_score: 0.5,
    current_difficulty: 'medium',
    recent_accuracy: 0,
    questions_answered: 0,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [streak, setStreak] = useState(0)

  // Fetch initial question
  const fetchNextQuestion = useCallback(async (lastQuestionData?: any) => {
    try {
      setLoading(true)
      const response = await fetch('/api/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'adaptive-next-question',
          payload: {
            category_id: category.id,
            session_id: sessionId,
            selected_subcategories: selectedSubcategories,
            answered_question_ids: answeredQuestionIds,
            last_question: lastQuestionData,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.exhausted) {
          toast.info('All questions completed for selected topics!')
          router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
          return
        }
        throw new Error(errorData.error || 'Failed to fetch question')
      }

      const data = await response.json()

      if (data.question) {
        setCurrentQuestion(data.question)
        setAnalytics(data.analytics)
        setSelectedAnswer(null)
        setShowFeedback(false)
        setQuestionStartTime(Date.now())
      } else if (data.exhausted) {
        toast.info('All questions completed!')
        router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
      }
    } catch (error: any) {
      console.error('Error fetching question:', error)
      toast.error(error.message || 'Failed to load question')
    } finally {
      setLoading(false)
    }
  }, [category.id, sessionId, selectedSubcategories, answeredQuestionIds, router])

  useEffect(() => {
    fetchNextQuestion()
  }, [fetchNextQuestion])

  const handleAnswerSelect = (answer: string) => {
    if (!showFeedback) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) {
      toast.error('Please select an answer')
      return
    }

    setSubmitting(true)
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
    
    // Fetch full question details from database to get correct_answer
    let actualCorrect = false
    let correctAnswerValue = ''
    let explanationText = ''
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: questionData } = await supabase
        .from('questions')
        .select('correct_answer, explanation, options')
        .eq('id', currentQuestion.id)
        .single()
      
      if (questionData) {
        correctAnswerValue = questionData.correct_answer
        explanationText = questionData.explanation || 'No explanation available'
        
        // Check if answer matches
        if (questionData.options && typeof questionData.options === 'object') {
          const opts = questionData.options as any
          // Check if selected answer matches the correct answer
          actualCorrect = selectedAnswer.trim().toLowerCase() === correctAnswerValue.trim().toLowerCase() ||
                         (opts.options && opts.options.includes(selectedAnswer) && opts.correct_answer === selectedAnswer)
        } else {
          actualCorrect = selectedAnswer.trim().toLowerCase() === correctAnswerValue.trim().toLowerCase()
        }
      }
    } catch (error) {
      console.error('Error fetching question details:', error)
      // Fallback: assume incorrect if we can't verify
      actualCorrect = false
    }

    setIsCorrect(actualCorrect)
    setCorrectAnswer(correctAnswerValue || 'See explanation')
    setExplanation(explanationText || 'No explanation available')
    setShowFeedback(true)

    if (actualCorrect) {
      setStreak((prev) => prev + 1)
    } else {
      setStreak(0)
    }

    // Update answered questions
    setAnsweredQuestionIds((prev) => [...prev, currentQuestion.id])

    // Call edge function with answer data
    try {
      await fetchNextQuestion({
        question_id: currentQuestion.id,
        is_correct: actualCorrect,
        time_taken: timeTaken,
        difficulty: currentQuestion.difficulty,
      })
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      toast.error('Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setShowFeedback(false)
    setSelectedAnswer(null)
    setIsCorrect(null)
  }

  const handleEndSession = () => {
    router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success/20 text-success dark:bg-success/30 dark:text-success-foreground'
      case 'hard':
        return 'bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive-foreground'
      default:
        return 'bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning-foreground'
    }
  }

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background-secondary to-background dark:from-background-secondary dark:to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-secondary to-background dark:from-background-secondary dark:to-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Adaptive Practice - {category?.name}
                    </CardTitle>
                    <p className="text-sm text-foreground-secondary dark:text-foreground-secondary mt-1">
                      Question {analytics.questions_answered + 1}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleEndSession}>
                    End Session
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Question Card */}
            {currentQuestion && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Question Display */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">{currentQuestion.subcategory?.name}</Badge>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-lg font-medium text-foreground dark:text-foreground">
                        {currentQuestion.text}
                      </p>
                    </div>

                    {/* Answer Options */}
                    {!showFeedback && currentQuestion.options && (
                      <div className="space-y-3 mt-6">
                        {(() => {
                          const opts = currentQuestion.options as any
                          // Handle structured options
                          if (opts.options && Array.isArray(opts.options)) {
                            return opts.options.map((option: string, index: number) => {
                              const optionKey = String.fromCharCode(65 + index) // A, B, C, D
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleAnswerSelect(option)}
                                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                                    selectedAnswer === option
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                                >
                                  <span className="font-semibold mr-2">{optionKey}:</span>
                                  <span>{option}</span>
                                </button>
                              )
                            })
                          }
                          // Fallback: handle object with A, B, C, D keys
                          return Object.entries(opts)
                            .filter(([key]) => !['correct_answer', 'explanation'].includes(key))
                            .map(([key, value]) => (
                              <button
                                key={key}
                                onClick={() => handleAnswerSelect(key)}
                                className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                                  selectedAnswer === key
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <span className="font-semibold mr-2">{key}:</span>
                                <span>{String(value)}</span>
                              </button>
                            ))
                        })()}
                      </div>
                    )}

                    {/* Feedback */}
                    {showFeedback && (
                      <div className={`p-4 rounded-lg border-2 mt-6 ${
                        isCorrect
                          ? 'border-success bg-success/10 dark:bg-success/20'
                          : 'border-destructive bg-destructive/10 dark:bg-destructive/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-success" />
                              <span className="font-semibold text-success dark:text-success-foreground">Correct!</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-destructive" />
                              <span className="font-semibold text-destructive dark:text-destructive-foreground">Incorrect</span>
                            </>
                          )}
                        </div>
                        {!isCorrect && correctAnswer && (
                          <p className="text-sm text-foreground-secondary dark:text-foreground-secondary mb-2">
                            Correct answer: <strong>{correctAnswer}</strong>
                          </p>
                        )}
                        {explanation && (
                          <p className="text-sm text-foreground-secondary dark:text-foreground-secondary">
                            {explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                      {!showFeedback ? (
                        <Button
                          size="lg"
                          onClick={handleSubmitAnswer}
                          disabled={!selectedAnswer || submitting}
                          className="flex-1"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Answer'
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          onClick={handleNextQuestion}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading Next Question...
                            </>
                          ) : (
                            'Next Question'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Metrics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mastery Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Mastery Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-secondary dark:text-foreground-secondary">Level</span>
                    <span className="font-bold text-2xl">{(analytics.mastery_score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={analytics.mastery_score * 100} className="h-3" />
                  <Badge className={getDifficultyColor(analytics.current_difficulty)}>
                    {analytics.current_difficulty.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary dark:text-foreground-secondary">Questions</span>
                  <span className="font-semibold">{analytics.questions_answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary dark:text-foreground-secondary">Recent Accuracy</span>
                  <span className="font-semibold">{analytics.recent_accuracy}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary dark:text-foreground-secondary">Current Streak</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Flag className="h-4 w-4 text-warning" />
                    {streak}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Selected Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Practicing Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subcategories.map((sub) => (
                    <Badge key={sub.id} variant="secondary" className="block text-xs">
                      {sub.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

