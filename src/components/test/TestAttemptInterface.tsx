'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  const isComponentMounted = useRef(true)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const questionGridRef = useRef<HTMLDivElement>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [canAnswerQuestions, setCanAnswerQuestions] = useState(false)
  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  // Detect device type on mount
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent)
      const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent) || 
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(userAgent))
      
      const isMobileOrTablet = isMobile || isTablet
      setIsMobileDevice(Boolean(isMobileOrTablet))
      
      console.log('📱 Device detection:', {
        userAgent,
        isMobile,
        isTablet,
        isMobileOrTablet,
        touchPoints: navigator.maxTouchPoints
      })
    }
    
    checkDevice()
  }, [])

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

  // Fullscreen enforcement - MANDATORY on ALL devices
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.fullscreenEnabled && isComponentMounted.current) {
          await document.documentElement.requestFullscreen()
          setIsFullscreen(true)
          setCanAnswerQuestions(true)
          setShowFullscreenDialog(false)
          setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
          toast.success('Fullscreen enabled - You can now answer questions')
        }
      } catch (err) {
        // Browser security may prevent auto-fullscreen without user interaction
        console.warn('Fullscreen not available:', err)
        setCanAnswerQuestions(false)
        setShowFullscreenDialog(true)
      }
    }

    // Attempt fullscreen immediately
    const timer = setTimeout(enterFullscreen, 500)

    const handleFullscreenChange = () => {
      // Only track violations if component is still mounted (user is on attempt page)
      if (!document.fullscreenElement && isComponentMounted.current) {
        setIsFullscreen(false)
        setCanAnswerQuestions(false)
        setShowFullscreenDialog(true)
        setFullscreenExitCount((prev) => prev + 1)
        setProctoringFlags((prev) => ({ ...prev, fullscreen_active: false }))
        addProctoringWarning('fullscreen_exit', 'Exited fullscreen mode', 'high')
        toast.error('Fullscreen required to continue')
      } else if (document.fullscreenElement) {
        setIsFullscreen(true)
        setCanAnswerQuestions(true)
        setShowFullscreenDialog(false)
        setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Cleanup: Exit fullscreen when component unmounts (leaving attempt page)
    return () => {
      isComponentMounted.current = false
      clearTimeout(timer)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      
      // Force exit fullscreen when leaving the attempt page
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn('Error exiting fullscreen on unmount:', err)
        })
      }
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

  // Camera access - ONLY for desktop/laptop devices
  useEffect(() => {
    // Skip camera on mobile/tablet devices
    if (isMobileDevice) {
      console.log('📱 Mobile/Tablet detected - Camera proctoring disabled')
      setCameraEnabled(false)
      setProctoringFlags((prev) => ({ ...prev, camera_enabled: false }))
      return
    }
    
    let mounted = true
    let streamHealthCheckInterval: NodeJS.Timeout | null = null
    
    const enableCamera = async () => {
      try {
        console.log('🎥 Requesting camera permission...')
        
        // Request camera permission with specific constraints
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false
        })
        
        console.log('✅ Camera permission granted, stream obtained')
        
        if (mounted) {
          // Store stream reference first
          cameraStreamRef.current = stream
          
          // Enable all tracks and prevent auto-stop
          stream.getTracks().forEach(track => {
            track.enabled = true
            console.log('📹 Track enabled:', track.label, 'State:', track.readyState)
            
            // Listen for track ending
            track.onended = () => {
              console.warn('⚠️ Camera track ended unexpectedly!')
              if (mounted) {
                setCameraEnabled(false)
                setProctoringFlags((prev) => ({ ...prev, camera_enabled: false }))
                addProctoringWarning('camera_stopped', 'Camera stopped unexpectedly', 'high')
                toast.error('Camera stopped! Please refresh and restart the test.')
              }
            }
          })
          
          // Set video element properties and play
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.muted = true
            videoRef.current.playsInline = true
            videoRef.current.autoplay = true
            
            // Force play
            videoRef.current.play().then(() => {
              console.log('▶️ Video playback started successfully')
              setCameraEnabled(true)
              setProctoringFlags((prev) => ({ ...prev, camera_enabled: true }))
              setVideoError(null)
              toast.success('Camera enabled for proctoring')
            }).catch((playErr) => {
              console.error('❌ Video play error:', playErr)
              setVideoError('Failed to play video')
              toast.error('Failed to start video. Please check camera permissions.')
            })
          } else {
            console.warn('⚠️ Video ref not available yet, will retry...')
            // Retry after a short delay
            setTimeout(() => {
              if (videoRef.current && mounted) {
                videoRef.current.srcObject = stream
                videoRef.current.muted = true
                videoRef.current.playsInline = true
                videoRef.current.autoplay = true
                videoRef.current.play().then(() => {
                  console.log('▶️ Video playback started (retry)')
                  setCameraEnabled(true)
                  setProctoringFlags((prev) => ({ ...prev, camera_enabled: true }))
                  setVideoError(null)
                  toast.success('Camera enabled for proctoring')
                }).catch(err => console.error('Retry play error:', err))
              }
            }, 500)
          }
          
          // Health check: Monitor stream every 5 seconds
          streamHealthCheckInterval = setInterval(() => {
            if (cameraStreamRef.current && mounted) {
              const tracks = cameraStreamRef.current.getTracks()
              const allActive = tracks.every(track => track.readyState === 'live' && track.enabled)
              
              if (!allActive) {
                console.error('❌ Camera stream health check failed!')
                tracks.forEach(track => {
                  console.log('Track status:', track.label, 'State:', track.readyState, 'Enabled:', track.enabled)
                })
                
                // Try to re-enable tracks
                tracks.forEach(track => {
                  if (track.readyState === 'live') {
                    track.enabled = true
                  }
                })
              } else {
                console.log('✓ Camera stream healthy')
              }
            }
          }, 5000)
          
        } else if (!mounted && stream) {
          console.log('Component unmounted before stream setup, cleaning up')
          stream.getTracks().forEach((track) => track.stop())
        }
      } catch (err) {
        console.error('❌ Camera error:', err)
        if (mounted) {
          setCameraDisabledCount((prev) => prev + 1)
          setProctoringFlags((prev) => ({ ...prev, camera_enabled: false }))
          addProctoringWarning('camera_disabled', 'Camera access denied', 'high')
          toast.error('Camera access denied. Please enable camera permissions to continue.')
        }
      }
    }

    // Request camera with a small delay to ensure video element is mounted
    console.log('🚀 Component mounted, initializing camera...')
    const initTimer = setTimeout(() => {
      enableCamera()
    }, 100)

    // Cleanup: Stop camera only when leaving attempt page
    return () => {
      console.log('🛑 Component unmounting, cleaning up camera...')
      mounted = false
      
      // Clear init timer
      clearTimeout(initTimer)
      
      // Clear health check interval
      if (streamHealthCheckInterval) {
        clearInterval(streamHealthCheckInterval)
      }
      
      // Stop all camera tracks
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => {
          track.stop()
          console.log('Stopped track:', track.label)
        })
        cameraStreamRef.current = null
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isMobileDevice])

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

  const handleAnswerChange = useCallback((optionKey: string) => {
    // Prevent answering if not in fullscreen
    if (!canAnswerQuestions) {
      setShowFullscreenDialog(true)
      return
    }
    
    // Double-click to clear: if clicking the same option, clear it
    const currentAnswer = answers[currentQuestion.id]?.selectedOption
    const newOption = currentAnswer === optionKey ? null : optionKey
    
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption: newOption,
        isMarkedForReview: prev[currentQuestion.id]?.isMarkedForReview || false,
        timeSpent: prev[currentQuestion.id]?.timeSpent || 0,
      },
    }))
  }, [canAnswerQuestions, currentQuestion.id, answers])

  const toggleMarkForReview = useCallback(() => {
    // Prevent marking if not in fullscreen
    if (!canAnswerQuestions) {
      setShowFullscreenDialog(true)
      return
    }
    
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption: prev[currentQuestion.id]?.selectedOption || null,
        isMarkedForReview: !prev[currentQuestion.id]?.isMarkedForReview,
        timeSpent: prev[currentQuestion.id]?.timeSpent || 0,
      },
    }))
  }, [canAnswerQuestions, currentQuestion.id])

  const navigateToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index)
  }, [])
  
  // Auto-scroll to current question in the grid - triggers at 3rd/4th row
  useEffect(() => {
    if (questionGridRef.current) {
      const container = questionGridRef.current
      const buttons = container.querySelectorAll('button')
      const currentButton = buttons[currentQuestionIndex] as HTMLElement
      
      if (currentButton) {
        // Calculate which row the current button is in (0-indexed)
        const currentRow = Math.floor(currentQuestionIndex / 5)
        
        // Get the first visible row index
        const scrollTop = container.scrollTop
        const buttonHeight = currentButton.offsetHeight
        const gap = 8 // 0.5rem = 8px
        const rowHeight = buttonHeight + gap
        const firstVisibleRow = Math.floor(scrollTop / rowHeight)
        
        // Trigger scroll if current question is in 3rd or 4th visible row or beyond
        const relativeRow = currentRow - firstVisibleRow
        
        if (relativeRow >= 2) {
          // Scroll to show current button in 2nd row position
          const targetScrollTop = (currentRow - 1) * rowHeight
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })
        } else if (relativeRow < 0) {
          // Scrolled past current question, scroll back
          currentButton.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }
    }
  }, [currentQuestionIndex])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }, [currentQuestionIndex])

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }, [currentQuestionIndex, questions.length])
  
  const handleSkip = useCallback(() => {
    // Skip to next question without saving
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      toast.info('Question skipped')
    }
  }, [currentQuestionIndex, questions.length])
  
  const handleClearAnswer = useCallback(() => {
    // Clear the current answer
    if (answers[currentQuestion.id]) {
      setAnswers((prev) => {
        const newAnswers = { ...prev }
        delete newAnswers[currentQuestion.id]
        return newAnswers
      })
      toast.success('Answer cleared')
    }
  }, [currentQuestion.id, answers])
  
  const handleSaveAndNext = useCallback(() => {
    // Save current answer (already saved in state) and move to next
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      if (answers[currentQuestion.id]?.selectedOption) {
        toast.success('Answer saved')
      }
    }
  }, [currentQuestionIndex, questions.length, answers, currentQuestion.id])

  const handleSubmitTest = async (autoSubmit = false) => {
    if (!autoSubmit && !showSubmitDialog) {
      setShowSubmitDialog(true)
      return
    }

    setIsSubmitting(true)
    
    // Exit fullscreen before submitting
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.warn('Error exiting fullscreen:', err)
      }
    }

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

      // Stop camera before navigation
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
        cameraStreamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      
      toast.success('Test submitted successfully!')
      router.push(`/test/${test.id}/results`)
    } catch (error) {
      console.error('Error submitting test:', error)
      toast.error('Failed to submit test')
      setIsSubmitting(false)
    }
  }

  const getQuestionStatus = useCallback((questionId: string) => {
    const answer = answers[questionId]
    if (!answer) return 'unanswered'
    if (answer.isMarkedForReview) return 'review'
    if (answer.selectedOption) return 'answered'
    return 'unanswered'
  }, [answers])

  const stats = useMemo(() => ({
    answered: Object.values(answers).filter((a) => a.selectedOption && !a.isMarkedForReview).length,
    review: Object.values(answers).filter((a) => a.isMarkedForReview).length,
    unanswered: questions.length - Object.keys(answers).length,
  }), [answers, questions.length])

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col">
      {/* Camera Feed Bar - Top of screen - ONLY VISIBLE ON DESKTOP/LAPTOP */}
      {!isMobileDevice && (
        <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-red-600 shadow-lg z-50">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="relative w-32 sm:w-40 md:w-48 aspect-video rounded-md overflow-hidden border-2 border-red-500 shadow-xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: cameraEnabled ? 'block' : 'none' }}
                />
                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-gray-500 animate-pulse mx-auto mb-2" />
                      {videoError && (
                        <p className="text-xs text-red-400">{videoError}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className={`absolute top-1 right-1 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                  cameraEnabled ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {cameraEnabled ? 'LIVE' : 'OFF'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Camera className={`h-4 w-4 ${cameraEnabled ? 'text-red-500' : 'text-gray-500'}`} />
                  <span className="text-white font-semibold text-sm">
                    {cameraEnabled ? 'Proctoring Active' : 'Camera Initializing...'}
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  {cameraEnabled ? 'Your test session is being monitored' : 'Please allow camera access'}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-red-600/20 border border-red-500/50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-200 font-medium">Do not switch tabs or exit fullscreen</span>
            </div>
          </div>
        </div>
      )}

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
      <div className="relative z-10 flex h-16 items-center justify-between border-b border-border bg-card px-4 flex-shrink-0">
        {/* Left: Test Title */}
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-sm sm:text-base font-semibold truncate max-w-[200px] sm:max-w-xs">{test.title}</h1>
          {!isTabActive && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Tab Inactive
            </Badge>
          )}
        </div>

        {/* Center: Platform Logo/Brand */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <span className="font-bold text-base sm:text-lg md:text-xl text-foreground">
              CrackAtom
            </span>
          </div>
        </div>

        {/* Right: Timer & Indicators */}
        <div className="flex items-center gap-4 flex-1 justify-end">
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
            <Badge 
              variant={cameraEnabled ? 'default' : 'destructive'}
              className="cursor-pointer"
              onClick={async () => {
                if (!cameraEnabled) {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                      video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                      } 
                    })
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

      <div className="relative z-10 flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          <div className="mx-auto max-w-4xl">
              {/* Question Header */}
              <div className="mb-4 sm:mb-6 flex items-center justify-between flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-2 flex-wrap">
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
                disabled={!canAnswerQuestions}
              >
                {['option a', 'option b', 'option c', 'option d', 'option e'].map((optionKey) => {
                  const optionValue = currentQuestion[optionKey]
                  if (!optionValue) return null

                  const isSelected = answers[currentQuestion.id]?.selectedOption === optionKey

                  return (
                    <div
                      key={optionKey}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                        canAnswerQuestions ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                      } ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50'
                      }`}
                      onClick={() => canAnswerQuestions && handleAnswerChange(optionKey)}
                      title={isSelected ? 'Click again to clear selection' : 'Click to select'}
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

              {/* Navigation - All buttons in one row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {/* Left: Previous Button */}
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

                {/* Center: Skip and Clear Buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={currentQuestionIndex === questions.length - 1}
                    size="default"
                    className="text-sm sm:text-base px-3 sm:px-4"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearAnswer}
                    disabled={!answers[currentQuestion.id]?.selectedOption}
                    size="default"
                    className="text-sm sm:text-base px-3 sm:px-4"
                  >
                    Clear
                  </Button>
                </div>

                {/* Right: Save & Next / Submit Button */}
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button 
                    onClick={() => handleSubmitTest(false)} 
                    variant="default" 
                    size="default" 
                    className="text-sm sm:text-base px-4 sm:px-6"
                  >
                    <Send className="mr-1 sm:mr-2 h-4 w-4" />
                    Submit
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSaveAndNext} 
                    variant="default" 
                    size="default" 
                    className="text-sm sm:text-base px-4 sm:px-6"
                  >
                    Save & Next
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

          {/* Question Grid - Fixed 5 rows x 5 columns with scrolling */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Questions</h3>
            <div className="relative">
              {/* Fixed height container for exactly 5 rows */}
              <div 
                ref={questionGridRef}
                className="overflow-y-auto overflow-x-hidden scroll-smooth" 
                style={{ 
                  maxHeight: 'calc(5 * (2.5rem + 0.5rem))', // 5 rows: (button height + gap) * 5
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(156 163 175) transparent'
                }}
              >
                <div className="grid grid-cols-5 gap-2 pr-1">
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
              {/* Scroll indicator - Only show text, no blur */}
              {questions.length > 25 && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-muted-foreground">Scroll to view all {questions.length} questions</span>
                </div>
              )}
            </div>
          </div>

          {/* Camera status indicator in sidebar - ONLY ON DESKTOP */}
          {!isMobileDevice && (
          <div className="mt-4">
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              cameraEnabled 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-2">
                <Camera className={`h-4 w-4 ${
                  cameraEnabled 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
                <span className={`text-sm font-medium ${
                  cameraEnabled 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {cameraEnabled ? 'Camera Active' : 'Camera Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  cameraEnabled ? 'bg-green-600' : 'bg-yellow-600'
                }`} />
                <span className={`text-xs ${
                  cameraEnabled 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {cameraEnabled ? 'LIVE' : 'WAIT'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {cameraEnabled ? 'Video feed visible at top of screen' : 'Requesting camera permission...'}
            </p>
          </div>
          )}
          
          {/* Mobile device indicator */}
          {isMobileDevice && (
          <div className="mt-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400"><rect width="7" height="12" x="2" y="6" rx="1"/><path d="M13 8.32a7.43 7.43 0 0 1 0 7.36"/><path d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58"/></svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Mobile Device</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Camera proctoring disabled on mobile</p>
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

      {/* Fullscreen Required Dialog */}
      <Dialog open={showFullscreenDialog} onOpenChange={setShowFullscreenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Maximize className="h-5 w-5 text-primary" />
              Fullscreen Required
            </DialogTitle>
            <DialogDescription>
              This test requires fullscreen mode to ensure a fair testing environment and prevent distractions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You must enable fullscreen mode to answer questions and continue the test.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Benefits of fullscreen mode:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Better focus without distractions</li>
                <li>Larger viewing area for questions</li>
                <li>Professional test environment</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen()
                  setIsFullscreen(true)
                  setCanAnswerQuestions(true)
                  setShowFullscreenDialog(false)
                  setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
                  toast.success('Fullscreen enabled')
                } catch (err) {
                  toast.error('Failed to enable fullscreen. Please try pressing F11.')
                }
              }}
              className="w-full"
            >
              <Maximize className="mr-2 h-4 w-4" />
              Enable Fullscreen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
