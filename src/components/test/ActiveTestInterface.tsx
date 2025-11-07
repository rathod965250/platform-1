'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Flag, X, Maximize, Minimize } from 'lucide-react'
import { QuestionDisplay } from './QuestionDisplay'

interface ActiveTestInterfaceProps {
  test: any
  attempt: any
  questions: any[]
  existingAnswers: Record<string, any>
}

export function ActiveTestInterface({
  test,
  attempt,
  questions,
  existingAnswers,
}: ActiveTestInterfaceProps) {
  const router = useRouter()
  const supabase = createClient()

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>(existingAnswers)
  const [timeRemaining, setTimeRemaining] = useState(test.duration_minutes * 60) // in seconds
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  const currentQuestion = questions[currentQuestionIndex]

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get question status
  const getQuestionStatus = (questionId: string) => {
    const answer = answers[questionId]
    if (!answer) return 'not-visited'
    if (answer.is_marked_for_review) return 'marked'
    if (answer.user_answer) return 'answered'
    return 'visited'
  }

  // Calculate stats
  const stats = {
    answered: Object.values(answers).filter((a: any) => a.user_answer && !a.is_marked_for_review).length,
    marked: Object.values(answers).filter((a: any) => a.is_marked_for_review).length,
    notAnswered: Object.values(answers).filter((a: any) => !a.user_answer && a.visited).length,
    notVisited: questions.length - Object.keys(answers).length,
  }

  // Save answer
  const saveAnswer = useCallback(async (questionId: string, userAnswer: string | null, isMarked: boolean = false) => {
    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
      
      const answerData = {
        attempt_id: attempt.id,
        question_id: questionId,
        user_answer: userAnswer,
        is_marked_for_review: isMarked,
        is_skipped: !userAnswer,
        is_correct: false, // Will be calculated on submit
        marks_obtained: 0,
        time_taken_seconds: timeSpent,
      }

      // Upsert answer
      const { data, error } = await supabase
        .from('attempt_answers')
        .upsert(answerData, { onConflict: 'attempt_id,question_id' })
        .select()
        .single()

      if (error) throw error

      // Update local state
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...answerData, visited: true },
      }))

      return data
    } catch (error) {
      console.error('Error saving answer:', error)
      toast.error('Failed to save answer')
    }
  }, [attempt.id, questionStartTime, supabase])

  // Handle answer change
  const handleAnswerChange = (answer: string) => {
    const existing = answers[currentQuestion.id] || {}
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...existing,
        user_answer: answer,
        visited: true,
      },
    }))
  }

  // Save and next
  const handleSaveAndNext = async () => {
    const currentAnswer = answers[currentQuestion.id]
    await saveAnswer(
      currentQuestion.id,
      currentAnswer?.user_answer || null,
      currentAnswer?.is_marked_for_review || false
    )
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    }
  }

  // Previous question
  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      const currentAnswer = answers[currentQuestion.id]
      await saveAnswer(
        currentQuestion.id,
        currentAnswer?.user_answer || null,
        currentAnswer?.is_marked_for_review || false
      )
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setQuestionStartTime(Date.now())
    }
  }

  // Clear response
  const handleClear = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        user_answer: null,
        visited: true,
      },
    }))
  }

  // Mark for review
  const handleMarkForReview = async () => {
    const currentAnswer = answers[currentQuestion.id] || {}
    const newMarkedStatus = !currentAnswer.is_marked_for_review
    
    await saveAnswer(
      currentQuestion.id,
      currentAnswer.user_answer || null,
      newMarkedStatus
    )
  }

  // Jump to question
  const handleJumpToQuestion = async (index: number) => {
    const currentAnswer = answers[currentQuestion.id]
    if (currentAnswer) {
      await saveAnswer(
        currentQuestion.id,
        currentAnswer.user_answer || null,
        currentAnswer.is_marked_for_review || false
      )
    }
    setCurrentQuestionIndex(index)
    setQuestionStartTime(Date.now())
  }

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullScreen(true)
    } else {
      document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  // Auto-submit
  const handleAutoSubmit = async () => {
    toast.info('Time is up! Submitting test automatically...')
    await handleSubmit()
  }

  // Submit test
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Save current question answer
      const currentAnswer = answers[currentQuestion.id]
      if (currentAnswer) {
        await saveAnswer(
          currentQuestion.id,
          currentAnswer.user_answer || null,
          currentAnswer.is_marked_for_review || false
        )
      }

      // Calculate score
      let correctAnswers = 0
      let score = 0
      let skippedCount = 0
      let markedCount = 0

      for (const question of questions) {
        const answer = answers[question.id]
        if (!answer || !answer.user_answer) {
          skippedCount++
          continue
        }

        if (answer.is_marked_for_review) {
          markedCount++
        }

        const isCorrect = answer.user_answer === question.correct_answer
        if (isCorrect) {
          correctAnswers++
          score += question.marks
        } else if (test.negative_marking) {
          score -= question.marks * 0.25
        }

        // Update answer with correct flag
        await supabase
          .from('attempt_answers')
          .update({
            is_correct: isCorrect,
            marks_obtained: isCorrect ? question.marks : (test.negative_marking ? -question.marks * 0.25 : 0),
          })
          .eq('attempt_id', attempt.id)
          .eq('question_id', question.id)
      }

      // Update test attempt
      const timeTaken = (test.duration_minutes * 60) - timeRemaining
      
      await supabase
        .from('test_attempts')
        .update({
          score,
          correct_answers: correctAnswers,
          skipped_count: skippedCount,
          marked_for_review_count: markedCount,
          time_taken_seconds: timeTaken,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)

      // Update leaderboard and user analytics
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const response = await fetch('/api/adaptive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: 'update-leaderboard',
              payload: {
                attempt_id: attempt.id,
                user_id: user.id,
                test_id: test.id,
              },
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Leaderboard updated:', data)
          } else {
            console.error('Failed to update leaderboard:', await response.text())
          }
        }
      } catch (error) {
        console.error('Error updating leaderboard:', error)
        // Don't fail the submission if leaderboard update fails
      }

      toast.success('Test submitted successfully!')
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }

      // Redirect to results
      router.push(`/test/${test.id}/results/${attempt.id}`)
    } catch (error) {
      console.error('Error submitting test:', error)
      toast.error('Failed to submit test')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {test.title}
            </h1>
            {test.company_name && (
              <Badge variant="outline" className="hidden sm:inline-flex">{test.company_name}</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Timer */}
            <div className={`text-sm sm:text-lg font-mono font-semibold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              ⏱️ <span className="hidden sm:inline">{formatTime(timeRemaining)}</span><span className="sm:hidden">{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</span>
            </div>

            {/* Fullscreen Toggle */}
            <Button variant="outline" size="sm" onClick={toggleFullScreen} className="hidden sm:inline-flex">
              {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            {/* Submit Button */}
            <Button
              onClick={() => setIsSubmitDialogOpen(true)}
              variant="default"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Submit Test</span>
              <span className="sm:hidden">Submit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-2 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
          {/* Question Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                  </Badge>
                </div>
              </div>

              <QuestionDisplay
                question={currentQuestion}
                answer={answers[currentQuestion.id]?.user_answer || null}
                onAnswerChange={handleAnswerChange}
              />

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={!answers[currentQuestion.id]?.user_answer}
                  >
                    Clear Response
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMarkForReview}
                    className={answers[currentQuestion.id]?.is_marked_for_review ? 'bg-yellow-50 border-yellow-500' : ''}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    {answers[currentQuestion.id]?.is_marked_for_review ? 'Unmark' : 'Mark for Review'}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleSaveAndNext}
                  >
                    Save & Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Question Palette
              </h3>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  <span>{stats.answered} Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                  <span>{stats.marked} Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                  <span>{stats.notAnswered} Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                  <span>{stats.notVisited} Not Visited</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const status = getQuestionStatus(question.id)
                  const isCurrent = index === currentQuestionIndex
                  
                  let bgColor = 'bg-gray-300 dark:bg-gray-600'
                  if (status === 'answered') bgColor = 'bg-green-500'
                  if (status === 'marked') bgColor = 'bg-yellow-500'
                  if (status === 'visited') bgColor = 'bg-red-500'
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => handleJumpToQuestion(index)}
                      className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center text-white text-sm font-semibold hover:opacity-80 transition-opacity ${
                        isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>

              {/* Submit Button */}
              <Button
                className="w-full mt-4"
                variant="destructive"
                onClick={() => setIsSubmitDialogOpen(true)}
              >
                Submit Test
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold">Test Summary:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Answered: {stats.answered}</li>
                  <li>Marked for Review: {stats.marked}</li>
                  <li>Not Answered: {stats.notAnswered + stats.notVisited}</li>
                </ul>
                <p className="mt-4">
                  Are you sure you want to submit? You cannot change answers after submission.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Review Again
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

