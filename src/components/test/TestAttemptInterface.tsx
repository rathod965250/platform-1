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
            status: 'in_progress',
            started_at: new Date().toISOString(),
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
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
      } catch (err) {
        console.error('Fullscreen error:', err)
        setFullscreenExitCount((prev) => prev + 1)
        addProctoringWarning('fullscreen_error', 'Failed to enter fullscreen mode', 'medium')
      }
    }

    enterFullscreen()

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
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
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

  // Camera access
  useEffect(() => {
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
      }
    }

    enableCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

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
        const isCorrect = answer.selectedOption === question?.correct_answer
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
          status: 'completed',
          completed_at: new Date().toISOString(),
          score,
          total_marks: questions.length,
          percentage: percentage.toFixed(2),
          time_taken_minutes: Math.floor(timeTaken / 60),
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
        await supabase.from('test_answers').insert(answerRecords)
      }

      // Update custom mock test with all violation data
      await supabase
        .from('custom_mock_tests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          score,
          percentage: percentage.toFixed(2),
          time_taken_minutes: Math.floor(timeTaken / 60),
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
    <div className="fixed inset-0 bg-gray-900 text-white">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-700 bg-gray-800 px-4">
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
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              timeRemaining < 300 ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg font-bold">{formatTime(timeRemaining)}</span>
          </div>

          {/* Proctoring Indicators */}
          <div className="flex items-center gap-2">
            <Badge variant={cameraEnabled ? 'default' : 'destructive'}>
              <Camera className="mr-1 h-3 w-3" />
              Camera
            </Badge>
            <Badge variant={isFullscreen ? 'default' : 'destructive'}>
              <Maximize className="mr-1 h-3 w-3" />
              Fullscreen
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="mx-auto max-w-4xl bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              {/* Question Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-lg">
                    Question {currentQuestionIndex + 1} / {questions.length}
                  </Badge>
                  <Badge variant="secondary">
                    {currentQuestion.subcategory?.name || 'General'}
                  </Badge>
                  <Badge
                    variant={
                      currentQuestion.difficulty === 'easy'
                        ? 'default'
                        : currentQuestion.difficulty === 'medium'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <Button
                  variant={answers[currentQuestion.id]?.isMarkedForReview ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleMarkForReview}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  {answers[currentQuestion.id]?.isMarkedForReview ? 'Marked' : 'Mark for Review'}
                </Button>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <h2 className="text-xl font-medium leading-relaxed text-white">
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* Options */}
              <RadioGroup
                value={answers[currentQuestion.id]?.selectedOption || ''}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                {['option_a', 'option_b', 'option_c', 'option_d'].map((optionKey) => {
                  const optionValue = currentQuestion[optionKey]
                  if (!optionValue) return null

                  const isSelected = answers[currentQuestion.id]?.selectedOption === optionKey

                  return (
                    <div
                      key={optionKey}
                      className={`flex items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                      }`}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} className="mt-1" />
                      <Label htmlFor={optionKey} className="flex-1 cursor-pointer text-base">
                        <span className="mr-2 font-bold">
                          {optionKey.split('_')[1].toUpperCase()}.
                        </span>
                        {optionValue}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={() => handleSubmitTest()} className="gap-2">
                    <Send className="h-4 w-4" />
                    Submit Test
                  </Button>
                ) : (
                  <Button onClick={() => navigateToQuestion(currentQuestionIndex + 1)}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-700 bg-gray-800 p-4 overflow-y-auto">
          {/* Stats */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Answered
              </span>
              <span className="font-bold">{stats.answered}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-yellow-500" />
                Marked
              </span>
              <span className="font-bold">{stats.review}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                Unanswered
              </span>
              <span className="font-bold">{stats.unanswered}</span>
            </div>
          </div>

          <Progress value={(stats.answered / questions.length) * 100} className="mb-4" />

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const status = getQuestionStatus(q.id)
              return (
                <button
                  key={q.id}
                  onClick={() => navigateToQuestion(index)}
                  className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                    currentQuestionIndex === index
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-gray-800'
                      : ''
                  } ${
                    status === 'answered'
                      ? 'bg-green-600 hover:bg-green-700'
                      : status === 'review'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          {/* Camera Feed */}
          {cameraEnabled && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-400">Proctoring Camera</p>
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-lg border border-gray-700"
              />
            </div>
          )}

          {/* Violation Summary */}
          {(tabSwitchCount > 0 || fullscreenExitCount > 0 || cameraDisabledCount > 0 || suspiciousActivityCount > 0) && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-red-400">Violations Detected</p>
              <div className="space-y-1 text-xs">
                {tabSwitchCount > 0 && (
                  <div className="flex justify-between text-red-300">
                    <span>Tab Switches:</span>
                    <span className="font-bold">{tabSwitchCount}</span>
                  </div>
                )}
                {fullscreenExitCount > 0 && (
                  <div className="flex justify-between text-red-300">
                    <span>Fullscreen Exits:</span>
                    <span className="font-bold">{fullscreenExitCount}</span>
                  </div>
                )}
                {cameraDisabledCount > 0 && (
                  <div className="flex justify-between text-red-300">
                    <span>Camera Issues:</span>
                    <span className="font-bold">{cameraDisabledCount}</span>
                  </div>
                )}
                {suspiciousActivityCount > 0 && (
                  <div className="flex justify-between text-red-300">
                    <span>Suspicious Activity:</span>
                    <span className="font-bold">{suspiciousActivityCount}</span>
                  </div>
                )}
              </div>
              <Alert className="border-red-600 bg-red-950/50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-xs text-red-300">
                  Total: {tabSwitchCount + fullscreenExitCount + cameraDisabledCount + suspiciousActivityCount} violation(s)
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
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
