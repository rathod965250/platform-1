'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Send,
  Camera,
  Maximize,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'

interface TestAttemptInterfaceProps {
  test: any
  questions: any[]
  userId: string
  userProfile: any
  existingAttempt: any
}

interface Answer {
  questionId: string
  selectedOption: string | null
  isMarkedForReview: boolean
  timeSpent: number
}

export default function TestAttemptInterface({
  test,
  questions,
  userId,
  userProfile,
  existingAttempt,
}: TestAttemptInterfaceProps) {
  const router = useRouter()
  const supabase = createClient()

  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [attemptId, setAttemptId] = useState<string | null>(existingAttempt?.id || null)
  const [timeRemaining, setTimeRemaining] = useState(test.duration_minutes * 60) // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Proctoring state
  const [proctoringWarnings, setProctoringWarnings] = useState<Array<{timestamp: string, type: string, message: string}>>([])
  const [violationTimestamps, setViolationTimestamps] = useState<Array<{timestamp: string, type: string, severity: string}>>([])
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0)
  const [cameraDisabledCount, setCameraDisabledCount] = useState(0)
  const [suspiciousActivityCount, setSuspiciousActivityCount] = useState(0)
  const [isTabActive, setIsTabActive] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [proctoringFlags, setProctoringFlags] = useState({
    camera_enabled: false,
    fullscreen_active: false,
    audio_enabled: false,
    network_stable: true,
  })
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentQuestion = questions[currentQuestionIndex]

  // Initialize test attempt
  useEffect(() => {
    const initializeAttempt = async () => {
      if (!attemptId) {
        const { data, error } = await supabase
          .from('test_attempts')
          .insert({
            test_id: test.id,
            user_id: userId,
            total_questions: questions.length,
            score: 0,
            correct_answers: 0,
            skipped_count: 0,
            marked_for_review_count: 0,
            time_taken_seconds: 0,
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating attempt:', error)
          toast.error('Failed to start test')
          return
        }

        setAttemptId(data.id)

        // Update custom mock test status
        await supabase
          .from('custom_mock_tests')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('test_id', test.id)
          .eq('user_id', userId)
      }
    }

    initializeAttempt()
  }, [])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitTest(true) // Auto-submit when time runs out
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Fullscreen enforcement
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        // Only request fullscreen if user has interacted with the page
        if (document.fullscreenEnabled) {
          await document.documentElement.requestFullscreen()
          setIsFullscreen(true)
          setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
        }
      } catch (err) {
        // Silently handle fullscreen errors - browser security prevents auto-fullscreen
        console.warn('Fullscreen not available:', err)
        // Don't count as violation on initial load
      }
    }

    // Delay fullscreen request to allow user interaction
    const timer = setTimeout(enterFullscreen, 1000)

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        setFullscreenExitCount((prev) => prev + 1)
        setProctoringFlags((prev) => ({ ...prev, fullscreen_active: false }))
        addProctoringWarning('fullscreen_exit', 'Exited fullscreen mode', 'high')
        toast.error('Please remain in fullscreen mode')
      } else {
        setIsFullscreen(true)
        setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false)
        const newCount = tabSwitchCount + 1
        setTabSwitchCount(newCount)
        addProctoringWarning('tab_switch', `Tab switched away (Count: ${newCount})`, 'high')
        toast.warning('Tab switch detected! Stay on this page.')
      } else {
        setIsTabActive(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [tabSwitchCount])

  // Camera access - respect user preference and device type
  useEffect(() => {
    const cameraPreference = userProfile?.test_preferences?.enableCameraProctoring ?? false
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (!cameraPreference || isMobile) {
      console.log('Camera proctoring disabled:', !cameraPreference ? 'user preference' : 'mobile device')
      return
    }

    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCameraEnabled(true)
          setProctoringFlags((prev) => ({ ...prev, camera_enabled: true }))
        }
      } catch (err) {
        console.error('Camera error:', err)
        setCameraDisabledCount((prev) => prev + 1)
        setProctoringFlags((prev) => ({ ...prev, camera_enabled: false }))
        addProctoringWarning('camera_disabled', 'Camera access denied', 'high')
        toast.error('Camera access denied. Please enable camera in settings.')
      }
    }

    enableCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.test_preferences?.enableCameraProctoring])

  // Prevent right-click and keyboard shortcuts
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault()
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault()
        setSuspiciousActivityCount((prev) => prev + 1)
        addProctoringWarning('suspicious_activity', 'Attempted to open developer tools', 'high')
      }
    }

    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('keydown', preventKeyboardShortcuts)

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('keydown', preventKeyboardShortcuts)
    }
  }, [])

  const addProctoringWarning = (type: string, message: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    const timestamp = new Date().toISOString()
    const timeString = new Date().toLocaleTimeString()
    
    setProctoringWarnings((prev) => [
      ...prev,
      { timestamp: timeString, type, message }
    ])
    
    setViolationTimestamps((prev) => [
      ...prev,
      { timestamp, type, severity }
    ])
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption: optionKey,
        isMarkedForReview: prev[currentQuestion.id]?.isMarkedForReview || false,
        timeSpent: prev[currentQuestion.id]?.timeSpent || 0,
      },
    }))
  }

  const toggleMarkForReview = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption: prev[currentQuestion.id]?.selectedOption || null,
        isMarkedForReview: !prev[currentQuestion.id]?.isMarkedForReview,
        timeSpent: prev[currentQuestion.id]?.timeSpent || 0,
      },
    }))
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSubmitTest = async (autoSubmit = false) => {
    if (!autoSubmit && !showSubmitDialog) {
      setShowSubmitDialog(true)
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate score
      let correctAnswers = 0
      const answerRecords = Object.values(answers).map((answer) => {
        const question = questions.find((q) => q.id === answer.questionId)
        const correctAnswer = question?.['correct answer'] || question?.correct_answer
        const isCorrect = answer.selectedOption === correctAnswer
        if (isCorrect) correctAnswers++

        return {
          test_attempt_id: attemptId,
          question_id: answer.questionId,
          selected_answer: answer.selectedOption,
          is_correct: isCorrect,
          time_spent: answer.timeSpent,
          is_marked_for_review: answer.isMarkedForReview,
        }
      })

      const score = correctAnswers
      const percentage = (correctAnswers / questions.length) * 100
      const timeTaken = test.duration_minutes * 60 - timeRemaining

      // Get browser and device info
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      }

      const deviceInfo = {
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints || 0,
      }

      // Update test attempt with all proctoring data
      await supabase
        .from('test_attempts')
        .update({
          score,
          correct_answers: correctAnswers,
          time_taken_seconds: timeTaken,
          submitted_at: new Date().toISOString(),
          proctoring_warnings: proctoringWarnings,
          violation_timestamps: violationTimestamps,
          tab_switch_count: tabSwitchCount,
          fullscreen_exit_count: fullscreenExitCount,
          camera_disabled_count: cameraDisabledCount,
          suspicious_activity_count: suspiciousActivityCount,
          proctoring_flags: proctoringFlags,
          browser_info: browserInfo,
          device_info: deviceInfo,
        })
        .eq('id', attemptId)

      // Insert answers
      if (answerRecords.length > 0) {
        const formattedAnswers = answerRecords.map(record => ({
          attempt_id: record.test_attempt_id,
          question_id: record.question_id,
          user_answer: record.selected_answer,
          is_correct: record.is_correct,
          time_taken_seconds: record.time_spent || 0,
          is_marked_for_review: record.is_marked_for_review || false,
          marks_obtained: record.is_correct ? 1 : 0,
        }))
        await supabase.from('attempt_answers').insert(formattedAnswers)
      }

      // Update custom mock test with all violation data
      await supabase
        .from('custom_mock_tests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          proctoring_warnings: proctoringWarnings,
          violation_timestamps: violationTimestamps,
          tab_switch_count: tabSwitchCount,
          fullscreen_exit_count: fullscreenExitCount,
          camera_disabled_count: cameraDisabledCount,
          suspicious_activity_count: suspiciousActivityCount,
          proctoring_flags: proctoringFlags,
        })
        .eq('test_id', test.id)
        .eq('user_id', userId)

      toast.success('Test submitted successfully!')
      router.push(`/test/${test.id}/results`)
    } catch (error) {
      console.error('Error submitting test:', error)
      toast.error('Failed to submit test')
      setIsSubmitting(false)
    }
  }

  const getQuestionStatus = (questionId: string) => {
    const answer = answers[questionId]
    if (!answer) return 'unanswered'
    if (answer.isMarkedForReview) return 'review'
    if (answer.selectedOption) return 'answered'
    return 'unanswered'
  }

  const stats = {
    answered: Object.values(answers).filter((a) => a.selectedOption && !a.isMarkedForReview).length,
    review: Object.values(answers).filter((a) => a.isMarkedForReview).length,
    unanswered: questions.length - Object.keys(answers).length,
  }

  return (
    <div className="fixed inset-0 bg-background text-foreground relative">
      {/* Watermark - Multiple instances for better coverage */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 text-8xl font-bold text-muted-foreground/5 rotate-[-45deg] select-none whitespace-nowrap">
          {userProfile?.full_name || userProfile?.email || 'Student'}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-bold text-muted-foreground/5 rotate-[-45deg] select-none whitespace-nowrap">
          {userProfile?.full_name || userProfile?.email || 'Student'}
        </div>
        <div className="absolute bottom-1/4 right-1/4 text-8xl font-bold text-muted-foreground/5 rotate-[-45deg] select-none whitespace-nowrap">
          {userProfile?.full_name || userProfile?.email || 'Student'}
        </div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">{test.title}</h1>
          {!isTabActive && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Tab Inactive
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2 border-2 transition-all ${
              timeRemaining < 300 
                ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/50 animate-pulse' 
                : 'bg-blue-500 text-white border-blue-600 shadow-md'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span className="font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
          </div>

          {/* Proctoring Indicators */}
          <div className="flex items-center gap-2">
            {userProfile?.test_preferences?.enableCameraProctoring && (
              <Badge 
                variant={cameraEnabled ? 'default' : 'destructive'}
                className="cursor-pointer"
                onClick={async () => {
                  if (!cameraEnabled) {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                      if (videoRef.current) {
                        videoRef.current.srcObject = stream
                        setCameraEnabled(true)
                        setProctoringFlags((prev) => ({ ...prev, camera_enabled: true }))
                        toast.success('Camera enabled')
                      }
                    } catch (err) {
                      toast.error('Failed to enable camera. Please check permissions.')
                    }
                  }
                }}
              >
                <Camera className="mr-1 h-3 w-3" />
                Camera
              </Badge>
            )}
            <Badge 
              variant={isFullscreen ? 'default' : 'destructive'}
              className="cursor-pointer"
              onClick={async () => {
                if (!isFullscreen) {
                  try {
                    await document.documentElement.requestFullscreen()
                    setIsFullscreen(true)
                    setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
                    toast.success('Fullscreen enabled')
                  } catch (err) {
                    toast.error('Failed to enable fullscreen. Please try manually pressing F11.')
                  }
                } else {
                  if (document.fullscreenElement) {
                    document.exitFullscreen()
                  }
                }
              }}
            >
              <Maximize className="mr-1 h-3 w-3" />
              Fullscreen
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          <div className="mx-auto max-w-4xl">
              {/* Question Header */}
              <div className="mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-sm sm:text-base px-2 sm:px-3 py-1">
                    Q {currentQuestionIndex + 1}/{questions.length}
                  </Badge>
                  <Badge variant="outline" className="text-sm sm:text-base px-2 sm:px-3 py-1 bg-muted/80 border-muted-foreground/30">
                    {currentQuestion.subcategory?.name || 'General'}
                  </Badge>
                  <Badge
                    className={`text-sm sm:text-base px-2 sm:px-3 py-1 border ${
                      currentQuestion.difficulty === 'easy'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
                        : currentQuestion.difficulty === 'medium'
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <Button
                  variant={answers[currentQuestion.id]?.isMarkedForReview ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleMarkForReview}
                  className="text-sm sm:text-base"
                >
                  <Flag className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{answers[currentQuestion.id]?.isMarkedForReview ? 'Marked' : 'Mark for Review'}</span>
                  <span className="sm:hidden">Mark</span>
                </Button>
              </div>

              {/* Question Text */}
              <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                  <span className="font-bold text-black dark:text-white mr-2">
                    {currentQuestionIndex + 1}.
                  </span>
                  {currentQuestion['question text'] || currentQuestion.question_text}
                </h2>
              </div>

              {/* Options */}
              <RadioGroup
                value={answers[currentQuestion.id]?.selectedOption || ''}
                onValueChange={handleAnswerChange}
                className="space-y-2"
              >
                {['option a', 'option b', 'option c', 'option d', 'option e'].map((optionKey) => {
                  const optionValue = currentQuestion[optionKey]
                  if (!optionValue) return null

                  const isSelected = answers[currentQuestion.id]?.selectedOption === optionKey

                  return (
                    <div
                      key={optionKey}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50'
                      }`}
                      onClick={() => handleAnswerChange(optionKey)}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} className="shrink-0" />
                      <Label htmlFor={optionKey} className="flex-1 cursor-pointer text-base leading-snug">
                        <span className="mr-2 font-bold text-base">
                          {optionKey.split(' ')[1].toUpperCase()}.
                        </span>
                        {optionValue}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>

              {/* Navigation */}
              <div className="mt-4 sm:mt-6 flex items-center justify-between gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  size="default"
                  className="text-sm sm:text-base px-4 sm:px-6"
                >
                  <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={() => handleSubmitTest(false)} variant="default" size="default" className="text-sm sm:text-base px-4 sm:px-6">
                    <Send className="mr-1 sm:mr-2 h-4 w-4" />
                    Submit
                  </Button>
                ) : (
                  <Button onClick={handleNext} variant="default" size="default" className="text-sm sm:text-base px-4 sm:px-6">
                    Next
                    <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-card border-t lg:border-t-0 lg:border-l border-border p-4 sm:p-6 overflow-y-auto max-h-[40vh] lg:max-h-none">
          {/* Stats */}
          <div className="mb-3 sm:mb-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
              <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-lg sm:text-xl font-bold text-green-600">{stats.answered}</div>
                <div className="text-xs text-muted-foreground">Answered</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-lg sm:text-xl font-bold text-yellow-600">{stats.review}</div>
                <div className="text-xs text-muted-foreground">Marked</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted border border-border">
                <div className="text-lg sm:text-xl font-bold text-muted-foreground">{stats.unanswered}</div>
                <div className="text-xs text-muted-foreground">Unanswered</div>
              </div>
            </div>
            <Progress value={(stats.answered / questions.length) * 100} className="h-2" />
          </div>

          {/* Question Grid */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Questions</h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const status = getQuestionStatus(q.id)
              return (
                <button
                  key={q.id}
                  onClick={() => navigateToQuestion(index)}
                  className={`aspect-square rounded-md text-xs sm:text-sm font-bold transition-all ${
                    currentQuestionIndex === index
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : ''
                  } ${
                    status === 'answered'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : status === 'review'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          </div>

          {/* Camera Feed - Desktop only */}
          {cameraEnabled && userProfile?.test_preferences?.enableCameraProctoring && (
            <div className="mt-4 hidden lg:block">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Proctoring</h3>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>
          )}

          {/* Violation Summary */}
          {(tabSwitchCount > 0 || fullscreenExitCount > 0 || cameraDisabledCount > 0 || suspiciousActivityCount > 0) && (
            <div className="mt-4 space-y-3 hidden lg:block">
              <h3 className="text-base font-semibold text-red-600 dark:text-red-400">Violations Detected</h3>
              <div className="space-y-2 text-sm">
                {tabSwitchCount > 0 && (
                  <div className="flex justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <span className="text-red-700 dark:text-red-300">Tab Switches:</span>
                    <span className="font-bold text-red-800 dark:text-red-200">{tabSwitchCount}</span>
                  </div>
                )}
                {fullscreenExitCount > 0 && (
                  <div className="flex justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <span className="text-red-700 dark:text-red-300">Fullscreen Exits:</span>
                    <span className="font-bold text-red-800 dark:text-red-200">{fullscreenExitCount}</span>
                  </div>
                )}
                {cameraDisabledCount > 0 && (
                  <div className="flex justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <span className="text-red-700 dark:text-red-300">Camera Issues:</span>
                    <span className="font-bold text-red-800 dark:text-red-200">{cameraDisabledCount}</span>
                  </div>
                )}
                {suspiciousActivityCount > 0 && (
                  <div className="flex justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <span className="text-red-700 dark:text-red-300">Suspicious Activity:</span>
                    <span className="font-bold text-red-800 dark:text-red-200">{suspiciousActivityCount}</span>
                  </div>
                )}
              </div>
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-700">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Total: {tabSwitchCount + fullscreenExitCount + cameraDisabledCount + suspiciousActivityCount} violation(s)
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit? You won't be able to change your answers after
              submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              Answered: <strong>{stats.answered}</strong> / {questions.length}
            </p>
            <p>
              Marked for Review: <strong>{stats.review}</strong>
            </p>
            <p>
              Unanswered: <strong>{stats.unanswered}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmitTest()} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
