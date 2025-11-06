'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Calculator,
  FileText,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  SkipForward,
} from 'lucide-react'
import { QuestionDisplay } from '@/components/test/QuestionDisplay'
import { AdaptiveQuestion, AdaptiveAnalytics } from '@/types/adaptive'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createClient } from '@/lib/supabase/client'

interface AdaptivePracticeInterfaceProps {
  category: any
  sessionId: string
  selectedSubcategories: string[]
  subcategories: Array<{ id: string; name: string }>
  questionCount: number
}

interface QuestionHistory {
  id: string
  text: string
  difficulty: string
  isCorrect: boolean | null
  isMarked: boolean
  timeSpent: number
  hasAnswer: boolean
}

export function AdaptivePracticeInterface({
  category,
  sessionId,
  selectedSubcategories,
  subcategories,
  questionCount,
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
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Enhanced features state
  const [timer, setTimer] = useState(0)
  const [showHints, setShowHints] = useState(false)
  const [hints, setHints] = useState<string | null>(null)
  const [solutionSteps, setSolutionSteps] = useState<string | null>(null)
  const [formulaUsed, setFormulaUsed] = useState<string | null>(null)
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set())
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([])
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportErrorType, setReportErrorType] = useState<string>('')
  const [reportDescription, setReportDescription] = useState('')
  const [showCorrectOptions, setShowCorrectOptions] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Pre-loaded questions state
  const [allQuestions, setAllQuestions] = useState<AdaptiveQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questionsLoaded, setQuestionsLoaded] = useState(false)
  const mobileMinimapRef = useRef<HTMLDivElement | null>(null)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!showFeedback && currentQuestion) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [showFeedback, currentQuestion])

  // Reset timer when new question loads
  useEffect(() => {
    if (currentQuestion && !showFeedback) {
      setTimer(0)
    }
  }, [currentQuestion?.id, showFeedback])

  // Fetch question details including hints, solution steps, formula
  const fetchQuestionDetails = useCallback(async (questionId: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('questions')
        .select('hints, solution_steps, formula_used, "correct answer"')
        .eq('id', questionId)
        .single()

      if (data) {
        setHints(data.hints || null)
        setSolutionSteps(data['solution_steps'] || null)
        setFormulaUsed(data['formula_used'] || null)
        if (data['correct answer']) {
          setCorrectAnswer(data['correct answer'])
        }
      }
    } catch (error) {
      console.error('Error fetching question details:', error)
    }
  }, [])

  // Fetch hints on demand
  const handleToggleHints = useCallback(async () => {
    if (!hints && currentQuestion) {
      // Fetch hints if not already loaded
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('questions')
          .select('hints')
          .eq('id', currentQuestion.id)
          .single()

        if (data && data.hints) {
          setHints(data.hints)
        }
      } catch (error) {
        console.error('Error fetching hints:', error)
      }
    }
    setShowHints(!showHints)
  }, [hints, currentQuestion, showHints])

  // Load all questions upfront
  const loadAllQuestions = useCallback(async () => {
    try {
      setLoading(true)
      toast.info('Loading questions...')
      
      // Fetch all questions for selected subcategories
      const supabase = createClient()
      
      // First, try a simpler query without nested joins
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select(`
          id,
          "question text",
          question_type,
          "option a",
          "option b",
          "option c",
          "option d",
          "option e",
          "correct answer",
          explanation,
          difficulty,
          subcategory_id
        `)
        .in('subcategory_id', selectedSubcategories)
        .limit(questionCount * 2) // Fetch more than needed for variety

      if (error) {
        console.error('Error loading questions:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        toast.error(`Failed to load questions: ${error.message || 'Unknown error'}`)
        return
      }

      if (!questionsData || questionsData.length === 0) {
        toast.error('No questions available for selected topics')
          router.push(`/practice/configure/${category.id}`)
          return
        }
        
      // Use subcategories prop that's already available (more reliable than querying)
      const subcategoryMap = new Map<string, any>()
      subcategories.forEach((sub) => {
        subcategoryMap.set(sub.id, {
          id: sub.id,
          name: sub.name,
          category: {
            name: category?.name || ''
          }
        })
      })

      // Process questions
      const processedQuestions: AdaptiveQuestion[] = questionsData.map((q: any) => {
        // Construct options from individual columns
        const optionsArray: string[] = []
        if (q['option a']) optionsArray.push(q['option a'])
        if (q['option b']) optionsArray.push(q['option b'])
        if (q['option c']) optionsArray.push(q['option c'])
        if (q['option d']) optionsArray.push(q['option d'])
        if (q['option e']) optionsArray.push(q['option e'])

        const subcategoryInfo = q.subcategory_id ? subcategoryMap.get(q.subcategory_id) : null

        return {
          id: q.id,
          text: q['question text'] || '',
          type: (q.question_type || 'mcq') as 'mcq' | 'true_false' | 'fill_blank',
          options: { options: optionsArray },
          difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
          subcategory: subcategoryInfo || {
            id: q.subcategory_id || '',
            name: subcategories.find(s => s.id === q.subcategory_id)?.name || '',
            category: {
              name: category?.name || ''
            }
          },
        }
      })

      // Shuffle and limit to questionCount
      const shuffled = processedQuestions.sort(() => Math.random() - 0.5)
      const limitedQuestions = shuffled.slice(0, questionCount)

      setAllQuestions(limitedQuestions)
      
      // Initialize question history
      const initialHistory: QuestionHistory[] = limitedQuestions.map((q, index) => ({
        id: q.id,
        text: q.text.substring(0, 50) + '...',
        difficulty: q.difficulty,
        isCorrect: null,
        isMarked: false,
        timeSpent: 0,
        hasAnswer: false,
      }))
      setQuestionHistory(initialHistory)
      
      // Set first question
      if (limitedQuestions.length > 0) {
        setCurrentQuestion(limitedQuestions[0])
        setCurrentQuestionIndex(0)
        await fetchQuestionDetails(limitedQuestions[0].id)
      }
      
      setQuestionsLoaded(true)
      toast.success(`Loaded ${limitedQuestions.length} questions`)
    } catch (error: any) {
      console.error('Error loading all questions:', error)
      toast.error('Failed to load questions')
            router.push(`/practice/configure/${category.id}`)
    } finally {
      setLoading(false)
    }
  }, [selectedSubcategories, questionCount, category, router, fetchQuestionDetails, subcategories])

  // Navigate to next question from pre-loaded questions
  const fetchNextQuestion = useCallback(async (lastQuestionData?: any) => {
    if (!questionsLoaded || allQuestions.length === 0) {
          return
        }
        
    try {
      setLoading(true)
      
      // Move to next question
      const nextIndex = currentQuestionIndex + 1
      
      if (nextIndex >= allQuestions.length) {
        // All questions completed
        setIsRedirecting(true)
        toast.info('All questions completed!')
        setTimeout(() => {
          router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
        }, 1000)
        return
      }

      const nextQuestion = allQuestions[nextIndex]
      
      setCurrentQuestion(nextQuestion)
      setCurrentQuestionIndex(nextIndex)
        setSelectedAnswer(null)
        setShowFeedback(false)
        setQuestionStartTime(Date.now())
      setErrorMessage(null)
      setIsRedirecting(false)
      setShowHints(false)
      setShowCorrectOptions(false)
      setHints(null)
      setSolutionSteps(null)
      setFormulaUsed(null)
      
      // Update analytics
      setAnalytics((prev) => ({
        ...prev,
        questions_answered: nextIndex,
      }))
      
      // Fetch additional question details
      await fetchQuestionDetails(nextQuestion.id)
    } catch (error: any) {
      console.error('Error navigating to next question:', error)
      toast.error('Failed to load next question')
    } finally {
      setLoading(false)
    }
  }, [questionsLoaded, allQuestions, currentQuestionIndex, category.id, sessionId, router, fetchQuestionDetails])

  // Load all questions on mount
  useEffect(() => {
    if (!questionsLoaded && sessionId && selectedSubcategories.length > 0) {
      loadAllQuestions()
    }
  }, [sessionId, selectedSubcategories.length, questionsLoaded, loadAllQuestions])

  // Auto-scroll mobile minimap to center current question (horizontal)
  // Automatically centers the current question button in the middle of the visible area
  useEffect(() => {
    if (mobileMinimapRef.current && questionsLoaded && allQuestions.length > 0 && currentQuestionIndex >= 0) {
      const container = mobileMinimapRef.current
      
      // Function to scroll to center the current question button
      const scrollToCenter = () => {
        try {
          // Find the button for the current question index
          const buttonElement = container.querySelector(`button[data-question-index="${currentQuestionIndex}"]`) as HTMLElement
          
          if (buttonElement && container) {
            // Get the button's position relative to the flex container (not the scrollable container)
            // The button is inside a flex container, so we need to get its offsetLeft relative to the flex parent
            const flexContainer = buttonElement.parentElement
            if (!flexContainer) return
            
            // Calculate button's position relative to the flex container
            const buttonLeft = buttonElement.offsetLeft
            const buttonWidth = buttonElement.offsetWidth
            const buttonCenter = buttonLeft + (buttonWidth / 2)
            
            // Get container dimensions
            const containerWidth = container.clientWidth
            const containerCenter = containerWidth / 2
            
            // Calculate scroll position to center the button
            // We want: buttonCenter - scrollLeft = containerCenter
            // So: scrollLeft = buttonCenter - containerCenter
            const scrollPosition = buttonCenter - containerCenter
            
            // Get max scroll position
            const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
            
            // Clamp scroll position to valid range
            const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll))
            
            // Scroll to center the button
            container.scrollLeft = finalScrollPosition
            
            // Also try smooth scroll as backup
            container.scrollTo({
              left: finalScrollPosition,
              behavior: 'smooth'
            })
          } else {
            // Fallback: calculate based on button width
            // Each button is approximately 36px wide + 6px gap = 42px
            const buttonWidth = 42
            const containerWidth = container.clientWidth
            const visibleButtons = Math.floor(containerWidth / buttonWidth)
            
            // Center the current question: show equal buttons on each side
            const buttonsBeforeCenter = Math.floor(visibleButtons / 2)
            const scrollPosition = Math.max(0, (currentQuestionIndex - buttonsBeforeCenter) * buttonWidth)
            const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
            
            const finalScrollPosition = Math.min(scrollPosition, maxScroll)
            
            // Scroll to center
            container.scrollLeft = finalScrollPosition
            container.scrollTo({
              left: finalScrollPosition,
              behavior: 'smooth'
            })
          }
        } catch (error) {
          console.error('Error scrolling to center:', error)
        }
      }
      
      // Use requestAnimationFrame for immediate scroll
      requestAnimationFrame(() => {
        scrollToCenter()
      })
      
      // Multiple delayed attempts to ensure scrolling works
      // First attempt after a short delay
      setTimeout(() => {
        scrollToCenter()
      }, 100)
      
      // Second attempt after a longer delay to ensure DOM is fully updated
      setTimeout(() => {
        scrollToCenter()
      }, 300)
      
      // Third attempt for edge cases
      setTimeout(() => {
        scrollToCenter()
      }, 600)
    }
  }, [currentQuestionIndex, questionsLoaded, allQuestions.length, currentQuestion?.id])

  const handleAnswerSelect = (answer: string) => {
    if (!showFeedback) {
      setSelectedAnswer(answer)
      // Update history to mark as answered
      if (currentQuestion) {
        setQuestionHistory((prev) => prev.map(q => 
          q.id === currentQuestion.id ? { ...q, hasAnswer: true } : q
        ))
      }
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) {
      toast.error('Please select an answer')
      return
    }

    setSubmitting(true)
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
    
    // Fetch full question details from database
    let actualCorrect = false
    let correctAnswerValue = ''
    let explanationText = ''
    
    try {
      const supabase = createClient()
      const { data: questionData } = await supabase
        .from('questions')
        .select('"correct answer", explanation, "option a", "option b", "option c", "option d", "option e"')
        .eq('id', currentQuestion.id)
        .single()
      
      if (questionData) {
        correctAnswerValue = questionData['correct answer'] || ''
        explanationText = questionData.explanation || 'No explanation available'
        
        // Check if answer matches
        // Handle both letter-based answers (A, B, C) and full option text
        const selectedAnswerNormalized = selectedAnswer.trim().toLowerCase()
        const correctAnswerNormalized = correctAnswerValue.trim().toLowerCase()
        
        // Direct comparison first
        actualCorrect = selectedAnswerNormalized === correctAnswerNormalized
        
        // If direct comparison fails, try matching option letters
        if (!actualCorrect) {
          // Check if both are single letters (A, B, C, D, E)
          if (selectedAnswerNormalized.length === 1 && correctAnswerNormalized.length === 1) {
            actualCorrect = selectedAnswerNormalized === correctAnswerNormalized
        } else {
            // Try to match by option text
            const optionMap: Record<string, string> = {
              'a': (questionData['option a'] || '').trim().toLowerCase(),
              'b': (questionData['option b'] || '').trim().toLowerCase(),
              'c': (questionData['option c'] || '').trim().toLowerCase(),
              'd': (questionData['option d'] || '').trim().toLowerCase(),
              'e': (questionData['option e'] || '').trim().toLowerCase(),
            }
            
            // If selected answer is a letter, get its text
            const selectedText = optionMap[selectedAnswerNormalized] || selectedAnswerNormalized
            const correctText = optionMap[correctAnswerNormalized] || correctAnswerNormalized
            
            // Compare texts
            actualCorrect = selectedText === correctText
          }
        }
        
        console.log('Answer check:', {
          selectedAnswer: selectedAnswerNormalized,
          correctAnswer: correctAnswerNormalized,
          actualCorrect,
        })
      }
    } catch (error) {
      console.error('Error fetching question details:', error)
      actualCorrect = false
    }

    setIsCorrect(actualCorrect)
    setCorrectAnswer(correctAnswerValue || 'See explanation')
    setExplanation(explanationText || 'No explanation available')
    setShowFeedback(true)
    setShowCorrectOptions(true)

    if (actualCorrect) {
      setStreak((prev) => prev + 1)
    } else {
      setStreak(0)
    }

    // Update question history
    setQuestionHistory((prev) => prev.map(q => 
      q.id === currentQuestion.id 
        ? { ...q, isCorrect: actualCorrect, timeSpent: timeTaken, hasAnswer: true }
        : q
    ))

    // Update answered questions
    setAnsweredQuestionIds((prev) => [...prev, currentQuestion.id])

    // Submit answer data to edge function (but don't fetch next question yet)
    try {
      const response = await fetch('/api/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'adaptive-next-question',
          payload: {
            category_id: category.id,
            session_id: sessionId,
            selected_subcategories: selectedSubcategories,
            answered_question_ids: [...answeredQuestionIds, currentQuestion.id],
            last_question: {
        question_id: currentQuestion.id,
        is_correct: actualCorrect,
        time_taken: timeTaken,
        difficulty: currentQuestion.difficulty,
            },
          },
        }),
      })
      
      // Just log the response, don't fetch next question
      if (response.ok) {
        const data = await response.json()
        console.log('Answer submitted successfully:', data)
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      // Don't show error toast as the answer is already validated locally
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextQuestion = async () => {
    // Store current question data before clearing
    const lastQuestionData = currentQuestion && showFeedback ? {
      question_id: currentQuestion.id,
      is_correct: isCorrect ?? false,
      time_taken: Math.floor((Date.now() - questionStartTime) / 1000),
      difficulty: currentQuestion.difficulty,
    } : undefined
    
    // Clear feedback state
    setShowFeedback(false)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setShowHints(false)
    setShowCorrectOptions(false)
    
    // Fetch next question with last question data
    await fetchNextQuestion(lastQuestionData)
  }

  const handleSkipQuestion = () => {
    if (questionsLoaded && currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      const nextQuestion = allQuestions[nextIndex]
      const historyItem = questionHistory.find(h => h.id === nextQuestion.id)
      
      setCurrentQuestionIndex(nextIndex)
      setCurrentQuestion(nextQuestion)
      
      // Clear current answer and feedback
      setSelectedAnswer(null)
      setShowFeedback(false)
      setIsCorrect(null)
      setShowHints(false)
      setShowCorrectOptions(false)
      
      // If next question was already answered, restore its state
      if (historyItem?.hasAnswer) {
        setShowFeedback(true)
        setIsCorrect(historyItem.isCorrect)
        fetchQuestionDetails(nextQuestion.id)
      } else {
        setHints(null)
        setSolutionSteps(null)
        setFormulaUsed(null)
        fetchQuestionDetails(nextQuestion.id)
      }
      
      setQuestionStartTime(Date.now())
      setAnalytics((prev) => ({
        ...prev,
        questions_answered: nextIndex,
      }))
      
      toast.info('Question skipped')
    } else {
      toast.info('No more questions to skip')
    }
  }

  const handlePreviousQuestion = () => {
    if (questionsLoaded && currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      const prevQuestion = allQuestions[prevIndex]
      const historyItem = questionHistory.find(h => h.id === prevQuestion.id)
      
      setCurrentQuestionIndex(prevIndex)
      setCurrentQuestion(prevQuestion)
      
      // Restore answer if previously answered
      if (historyItem?.hasAnswer) {
        // Restore feedback state if answer was submitted
        setShowFeedback(true)
        setIsCorrect(historyItem.isCorrect)
        // We'll need to fetch the correct answer and explanation
        fetchQuestionDetails(prevQuestion.id).then(() => {
          // The correct answer and explanation will be set by fetchQuestionDetails
        })
      } else {
        setSelectedAnswer(null)
        setShowFeedback(false)
        setIsCorrect(null)
      }
      
      setQuestionStartTime(Date.now())
      setShowHints(false)
      setShowCorrectOptions(false)
      setHints(null)
      setSolutionSteps(null)
      setFormulaUsed(null)
      fetchQuestionDetails(prevQuestion.id)
      setAnalytics((prev) => ({
        ...prev,
        questions_answered: prevIndex,
      }))
    } else {
      toast.info('No previous question available')
    }
  }

  const handleClearResponse = () => {
    setSelectedAnswer(null)
    if (currentQuestion) {
      setQuestionHistory((prev) => prev.map(q => 
        q.id === currentQuestion.id ? { ...q, hasAnswer: false } : q
      ))
    }
    toast.info('Response cleared')
  }

  const handleMarkForReview = () => {
    if (currentQuestion) {
      setMarkedQuestions((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(currentQuestion.id)) {
          newSet.delete(currentQuestion.id)
          toast.info('Removed from review')
        } else {
          newSet.add(currentQuestion.id)
          toast.info('Marked for review')
        }
        // Update history
        setQuestionHistory((prev) => prev.map(q => 
          q.id === currentQuestion.id ? { ...q, isMarked: newSet.has(currentQuestion.id) } : q
        ))
        return newSet
      })
    }
  }

  const handleReportError = async () => {
    if (!reportErrorType || !reportDescription.trim()) {
      toast.error('Please select an error type and provide a description')
      return
    }

    try {
      const response = await fetch('/api/questions/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion?.id,
          error_type: reportErrorType,
          description: reportDescription,
          user_answer: selectedAnswer,
          correct_answer: correctAnswer,
        }),
      })

      if (response.ok) {
        toast.success('Error reported successfully. Admin will be notified.')
        setShowReportDialog(false)
        setReportErrorType('')
        setReportDescription('')
      } else {
        toast.error('Failed to report error. Please try again.')
      }
    } catch (error) {
      console.error('Error reporting question:', error)
      toast.error('Failed to report error. Please try again.')
    }
  }

  const handleEndSession = () => {
    setShowEndSessionDialog(true)
  }

  const handleConfirmEndSession = () => {
    setShowEndSessionDialog(false)
    router.push(`/practice/adaptive/${category.id}/${sessionId}/summary`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700'
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
    }
  }

  // Calculate progress
  const totalQuestions = allQuestions.length || questionHistory.length
  const answeredCount = questionHistory.filter(q => q.hasAnswer).length
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading practice session...</p>
        </div>
      </div>
    )
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (!loading && !currentQuestion && errorMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-lg font-semibold text-foreground">Unable to Load Practice Session</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => {
                  setErrorMessage(null)
                  setLoading(true)
                  fetchNextQuestion()
              }}>
                Try Again
              </Button>
              <Button onClick={() => router.push(`/practice/configure/${category.id}`)}>
                Select Different Topics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {category?.name}
            </h1>
          </div>
          
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Timer */}
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm font-mono font-semibold text-green-700 dark:text-green-300">
                  {formatTime(timer)}
                </span>
              </div>

            {/* Question Counter */}
              <div className="text-xs sm:text-sm font-semibold text-foreground px-2">
                Q{questionsLoaded ? currentQuestionIndex + 1 : analytics.questions_answered + 1} / {totalQuestions}
            </div>

            {/* End Session Button */}
            <Button
              onClick={handleEndSession}
              variant="destructive"
              size="sm"
              className="text-xs h-8 px-2 sm:px-3 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="hidden sm:inline">End Session</span>
              <span className="sm:hidden">End</span>
            </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Question Area */}
          <div className={`${questionHistory.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3 sm:space-y-4`}>
            {currentQuestion && (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  {/* Progress Bar - Above Question Header */}
                  <div className="mb-3 sm:mb-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{answeredCount} / {totalQuestions}</span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className="h-2 bg-muted"
                    />
                  </div>

                  {/* Question Header */}
                  <div className="mb-4 sm:mb-6 space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-foreground">
                          Question {questionsLoaded ? currentQuestionIndex + 1 : analytics.questions_answered + 1} / {totalQuestions}
                  </h2>
                        <Badge variant="outline" className={`text-xs ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </Badge>
                    {currentQuestion.subcategory?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {currentQuestion.subcategory.name}
                      </Badge>
                    )}
                  </div>
                      
                      {/* Mobile Minimap - Right Side of Question Header */}
                      {questionsLoaded && allQuestions.length > 0 && (
                        <div className="lg:hidden w-full sm:w-[210px] sm:flex-shrink-0 sm:ml-2">
                          <div 
                            ref={mobileMinimapRef}
                            className="relative h-[40px] overflow-x-auto overflow-y-hidden rounded-md border border-border px-1.5 pt-1.5 pb-3 bg-purple-50 dark:bg-purple-950/20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            style={{ scrollBehavior: 'smooth' }}
                          >
                            <div className="flex flex-row gap-1.5 min-w-max">
                              {allQuestions.map((q, index) => {
                                const historyItem = questionHistory.find(h => h.id === q.id)
                                const isCurrent = index === currentQuestionIndex && !showFeedback
                                const isAnswered = historyItem?.hasAnswer || false
                                const isMarked = markedQuestions.has(q.id)
                                
                                let buttonClass = 'relative p-1.5 rounded-md border-2 transition-all text-xs font-semibold text-center flex-shrink-0 min-w-[36px] h-7 flex items-center justify-center overflow-hidden '
                                let hasSplitColor = false
                                
                                if (isCurrent) {
                                  buttonClass += 'border-primary bg-primary/20 ring-2 ring-primary/30 animate-pulse'
                                } else if (isAnswered && isMarked) {
                                  // Both attempted and marked - show half green, half purple (diagonal split)
                                  buttonClass += 'border-green-500 bg-green-500 text-white'
                                  hasSplitColor = true
                                } else if (isAnswered) {
                                  buttonClass += 'border-green-500 bg-green-500 text-white'
                                } else if (isMarked) {
                                  buttonClass += 'border-purple-500 bg-purple-500 text-white'
                                } else {
                                  buttonClass += 'border-border bg-muted text-muted-foreground'
                                }
                                
                                return (
                                  <button
                                    key={q.id}
                                    data-question-index={index}
                                    className={buttonClass}
                                    onClick={() => {
                                      if (index !== currentQuestionIndex) {
                                        const historyItem = questionHistory.find(h => h.id === q.id)
                                        
                                        setCurrentQuestionIndex(index)
                                        setCurrentQuestion(q)
                                        
                                        if (historyItem?.hasAnswer) {
                                          setShowFeedback(true)
                                          setIsCorrect(historyItem.isCorrect)
                                        } else {
                                          setSelectedAnswer(null)
                                          setShowFeedback(false)
                                          setIsCorrect(null)
                                        }
                                        
                                        setQuestionStartTime(Date.now())
                                        setShowHints(false)
                                        setShowCorrectOptions(false)
                                        setHints(null)
                                        setSolutionSteps(null)
                                        setFormulaUsed(null)
                                        fetchQuestionDetails(q.id)
                                        setAnalytics((prev) => ({
                                          ...prev,
                                          questions_answered: index,
                                        }))
                                      }
                                    }}
                                    title={`Q${index + 1}: ${q.text.substring(0, 50)}...`}
                                  >
                                    {hasSplitColor && (
                                      <div 
                                        className="absolute inset-0 bg-purple-500"
                                        style={{
                                          clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                                        }}
                                      />
                                    )}
                                    <span className="relative z-10 font-semibold">{index + 1}</span>
                                    {isCurrent && (
                                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse z-20" />
                                    )}
                                  </button>
                                )
                              })}
                </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkForReview}
                        className={`h-8 w-8 p-0 ${markedQuestions.has(currentQuestion.id) ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        {markedQuestions.has(currentQuestion.id) ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Flag className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Report Question Error</DialogTitle>
                            <DialogDescription>
                              Help us improve by reporting any errors you find in this question.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Error Type</Label>
                              <RadioGroup value={reportErrorType} onValueChange={setReportErrorType}>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="option_wrong" id="option_wrong" />
                                    <Label htmlFor="option_wrong" className="cursor-pointer">Option Wrong</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="question_wrong" id="question_wrong" />
                                    <Label htmlFor="question_wrong" className="cursor-pointer">Question Wrong</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="wrong_answer" id="wrong_answer" />
                                    <Label htmlFor="wrong_answer" className="cursor-pointer">Wrong Answer</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="wrong_hint" id="wrong_hint" />
                                    <Label htmlFor="wrong_hint" className="cursor-pointer">Wrong Hint</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="wrong_formula" id="wrong_formula" />
                                    <Label htmlFor="wrong_formula" className="cursor-pointer">Wrong Formula</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="wrong_explanation" id="wrong_explanation" />
                                    <Label htmlFor="wrong_explanation" className="cursor-pointer">Wrong Explanation</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="other" id="other" />
                                    <Label htmlFor="other" className="cursor-pointer">Other</Label>
                                  </div>
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                placeholder="Please describe the error in detail..."
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleReportError}>
                              Submit Report
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      </div>
                    </div>
                  </div>

                  {/* Question Display */}
                {!showFeedback ? (
                    <div className="space-y-4 sm:space-y-6">
                  <QuestionDisplay
                    question={{
                      id: currentQuestion.id,
                      question_text: currentQuestion.text,
                      question_type: currentQuestion.type || 'mcq',
                      options: currentQuestion.options,
                      correct_answer: '',
                      explanation: '',
                      marks: 1,
                      difficulty: currentQuestion.difficulty,
                      subcategory: currentQuestion.subcategory,
                    }}
                    answer={selectedAnswer}
                    onAnswerChange={handleAnswerSelect}
                  />

                      {/* Hints Display (shown when hints button is clicked) */}
                      {showHints && hints && (
                        <div className="p-3 sm:p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 text-sm text-foreground">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">Hints</span>
                          </div>
                          {hints}
                        </div>
                      )}

                      {/* Solution Steps and Formula (always shown if available) */}
                      {(solutionSteps || formulaUsed) && (
                        <div className="space-y-3 pt-4 border-t border-border">
                          {solutionSteps && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <FileText className="h-4 w-4 text-primary" />
                                Solution Steps
                              </div>
                              <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground whitespace-pre-wrap">
                                {solutionSteps}
                              </div>
                            </div>
                          )}
                          
                          {formulaUsed && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Calculator className="h-4 w-4 text-green-600" />
                                Formula Used
                              </div>
                              <div className="p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-foreground font-mono">
                                {formulaUsed}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-4 mt-6 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearResponse}
                          disabled={!selectedAnswer || submitting}
                          className="flex-shrink-0"
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Clear
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousQuestion}
                          disabled={questionHistory.length <= 1 || submitting}
                          className="flex-shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1.5" />
                          Previous
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleHints}
                          className="flex-shrink-0"
                        >
                          <Lightbulb className={`h-4 w-4 mr-1.5 ${showHints ? 'text-yellow-500' : ''}`} />
                          Hints
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSkipQuestion}
                          disabled={submitting || currentQuestionIndex >= allQuestions.length - 1}
                          className="flex-shrink-0"
                        >
                          <SkipForward className="h-4 w-4 mr-1.5" />
                          Skip
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={handleSubmitAnswer}
                          disabled={!selectedAnswer || submitting}
                          className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white ml-auto"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit'
                          )}
                        </Button>
                      </div>
                    </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show question with selected answer */}
                    <QuestionDisplay
                      question={{
                        id: currentQuestion.id,
                        question_text: currentQuestion.text,
                        question_type: currentQuestion.type || 'mcq',
                        options: currentQuestion.options,
                        correct_answer: correctAnswer || '',
                        explanation: explanation || '',
                        marks: 1,
                        difficulty: currentQuestion.difficulty,
                        subcategory: currentQuestion.subcategory,
                      }}
                      answer={selectedAnswer}
                      onAnswerChange={() => {}}
                    />

                      {/* Show Correct Options */}
                      {showCorrectOptions && correctAnswer && (
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="font-semibold text-green-700 dark:text-green-300">Correct Answer: {correctAnswer}</span>
                          </div>
                        </div>
                      )}

                    {/* Feedback */}
                    <div className={`p-4 rounded-lg border-2 ${
                      isCorrect
                          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30'
                          : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <>
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-green-700 dark:text-green-300">Correct!</span>
                          </>
                        ) : (
                          <>
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                              <span className="font-semibold text-red-700 dark:text-red-300">Incorrect</span>
                          </>
                        )}
                      </div>
                      {!isCorrect && correctAnswer && (
                          <p className="text-sm text-foreground mb-2">
                            Correct answer: <strong className="text-green-700 dark:text-green-300">{correctAnswer}</strong>
                        </p>
                      )}
                      {explanation && (
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                          {explanation}
                        </p>
                      )}
                    </div>

                      {/* Next Question Button */}
                      <div className="flex justify-end pt-2">
                    <Button
                      size="lg"
                      onClick={handleNextQuestion}
                      disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                        </>
                      ) : (
                            <>
                              Next
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                      )}
                    </Button>
                </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Question Minimap Sidebar - Desktop Only */}
          {questionsLoaded && allQuestions.length > 0 && (
            <div className="hidden lg:block lg:col-span-4">
              <Card className="border-border bg-card shadow-sm sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Question Minimap</CardTitle>
              </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {allQuestions.map((q, index) => {
                      const historyItem = questionHistory.find(h => h.id === q.id)
                      const isCurrent = index === currentQuestionIndex && !showFeedback
                      const isAnswered = historyItem?.hasAnswer || false
                      const isMarked = markedQuestions.has(q.id)
                      const isCorrect = historyItem?.isCorrect
                      
                      let buttonClass = 'relative p-2 rounded-md border-2 transition-all hover:scale-105 text-xs font-semibold cursor-pointer overflow-hidden '
                      let hasSplitColor = false
                      
                      // Priority order: Current > Attempted & Marked (half green/half purple) > Attempted > Marked > Unanswered
                      if (isCurrent) {
                        // Current question - show blue with pulse
                        buttonClass += 'border-primary bg-primary/20 ring-2 ring-primary/30 animate-pulse'
                      } else if (isAnswered && isMarked) {
                        // Both attempted and marked - show half green, half purple (diagonal split)
                        buttonClass += 'border-green-500 bg-green-500 text-white hover:bg-green-600'
                        hasSplitColor = true
                      } else if (isAnswered) {
                        // Attempted question - show green (regardless of correct/incorrect)
                        buttonClass += 'border-green-500 bg-green-500 text-white hover:bg-green-600'
                      } else if (isMarked) {
                        // Marked for review - show purple (only if NOT attempted)
                        buttonClass += 'border-purple-500 bg-purple-500 text-white hover:bg-purple-600'
                      } else {
                        // Unanswered/unattempted - show gray
                        buttonClass += 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
                      }
                      
                      return (
                        <button
                          key={q.id}
                          className={buttonClass}
                          onClick={() => {
                            // Navigate to clicked question
                            if (index !== currentQuestionIndex) {
                              const historyItem = questionHistory.find(h => h.id === q.id)
                              
                              setCurrentQuestionIndex(index)
                              setCurrentQuestion(q)
                              
                              // Restore answer if previously answered
                              if (historyItem?.hasAnswer) {
                                setShowFeedback(true)
                                setIsCorrect(historyItem.isCorrect)
                                fetchQuestionDetails(q.id)
                              } else {
                                setSelectedAnswer(null)
                                setShowFeedback(false)
                                setIsCorrect(null)
                                setHints(null)
                                setSolutionSteps(null)
                                setFormulaUsed(null)
                                fetchQuestionDetails(q.id)
                              }
                              
                              setQuestionStartTime(Date.now())
                              setShowHints(false)
                              setShowCorrectOptions(false)
                              setAnalytics((prev) => ({
                                ...prev,
                                questions_answered: index,
                              }))
                            }
                          }}
                          title={`Q${index + 1}: ${q.text.substring(0, 50)}...`}
                        >
                          {hasSplitColor && (
                            <div 
                              className="absolute inset-0 bg-purple-500"
                              style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                              }}
                            />
                          )}
                          <span className="relative z-10">{index + 1}</span>
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse z-20" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-xs font-medium text-foreground mb-2">Status</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-500"></div>
                        <span className="text-muted-foreground">Attempted</span>
                </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded border-2 border-border bg-muted"></div>
                        <span className="text-muted-foreground">Unanswered</span>
                </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded border-2 border-purple-500 bg-purple-500"></div>
                        <span className="text-muted-foreground">Marked</span>
                </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>

      {/* End Session Dialog */}
      <Dialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>End Practice Session</DialogTitle>
            <DialogDescription>
              Review your practice session summary before ending.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border border-border bg-card">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {questionHistory.filter(q => q.hasAnswer).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Attempted</div>
                </div>
              <div className="text-center p-4 rounded-lg border border-border bg-card">
                <div className="text-2xl font-bold text-muted-foreground">
                  {questionHistory.filter(q => !q.hasAnswer).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Not Attempted</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-border bg-card">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {markedQuestions.size}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Marked</div>
              </div>
            </div>

            {/* Question Minimap */}
            {questionsLoaded && allQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Question Overview</h3>
                  <div className="text-xs text-muted-foreground">
                    Total: {allQuestions.length} questions
                </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto p-2">
                  {allQuestions.map((q, index) => {
                    const historyItem = questionHistory.find(h => h.id === q.id)
                    const isAnswered = historyItem?.hasAnswer || false
                    const isMarked = markedQuestions.has(q.id)
                    
                    let buttonClass = 'relative p-2 rounded-md border-2 transition-all text-xs font-semibold text-center overflow-hidden '
                    let hasSplitColor = false
                    
                    // Priority order: Attempted & Marked (half green/half purple) > Attempted > Marked > Unanswered
                    if (isAnswered && isMarked) {
                      // Both attempted and marked - show half green, half purple (diagonal split)
                      buttonClass += 'border-green-500 bg-green-500 text-white'
                      hasSplitColor = true
                    } else if (isAnswered) {
                      buttonClass += 'border-green-500 bg-green-500 text-white'
                    } else if (isMarked) {
                      buttonClass += 'border-purple-500 bg-purple-500 text-white'
                    } else {
                      buttonClass += 'border-border bg-muted text-muted-foreground'
                    }
                    
                    return (
                      <button
                        key={q.id}
                        className={buttonClass}
                        title={`Q${index + 1}: ${q.text.substring(0, 50)}...`}
                        disabled
                      >
                        {hasSplitColor && (
                          <div 
                            className="absolute inset-0 bg-purple-500"
                            style={{
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                            }}
                          />
                        )}
                        <span className="relative z-10">{index + 1}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-medium text-foreground mb-2">Status</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-500"></div>
                      <span className="text-muted-foreground">Attempted</span>
          </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-2 border-border bg-muted"></div>
                      <span className="text-muted-foreground">Unanswered</span>
        </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border-2 border-purple-500 bg-purple-500"></div>
                      <span className="text-muted-foreground">Marked</span>
      </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndSessionDialog(false)}>
              Continue Practice
            </Button>
            <Button onClick={handleConfirmEndSession} className="bg-green-600 hover:bg-green-700 text-white">
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
