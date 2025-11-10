'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SystemCheckCard } from '@/components/test/SystemCheckCard'
import {
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Camera,
  Volume2,
  Wifi,
  Battery,
  Shield,
  Play,
  ArrowLeft,
} from 'lucide-react'

interface TestInstructionsProps {
  test: any
  questionsCount: number
  hasExistingAttempt: boolean
  userId: string
}

export default function TestInstructions({
  test,
  questionsCount,
  hasExistingAttempt,
  userId,
}: TestInstructionsProps) {
  const router = useRouter()
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [systemCheckPassed, setSystemCheckPassed] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleStartTest = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the test guidelines before starting')
      return
    }

    setIsStarting(true)
    router.push(`/test/${test.id}/attempt`)
  }

  const instructions = [
    'Read each question carefully before answering',
    'You can navigate between questions using the navigation panel',
    'Mark questions for review if you want to revisit them later',
    'Your progress is automatically saved',
    'Once submitted, you cannot change your answers',
    'Do not refresh the page or close the browser during the test',
    'Ensure stable internet connection throughout the test',
  ]

  const proctoringSystems = [
    { icon: Monitor, label: 'Screen Monitoring', description: 'Full screen mode required' },
    { icon: Camera, label: 'Camera Access', description: 'Webcam monitoring enabled' },
    { icon: Volume2, label: 'Audio Detection', description: 'Microphone monitoring active' },
    { icon: Wifi, label: 'Network Stability', description: 'Stable connection required' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/test/mock')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Button>
        </div>

        {/* Test Title Card */}
        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                  {test.title}
                </CardTitle>
                {test.description && (
                  <CardDescription className="mt-2 text-base">
                    {test.description}
                  </CardDescription>
                )}
              </div>
              <div className="rounded-lg bg-primary/10 px-4 py-2">
                <p className="text-sm font-medium text-primary">Mock Test</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {questionsCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {test.duration_minutes} min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {test.total_marks}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Attempt Warning */}
        {hasExistingAttempt && (
          <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              You have already attempted this test. Starting again will create a new attempt.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Test Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{instruction}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Proctoring Systems */}
            <Card className="border-2 border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Shield className="h-5 w-5" />
                  Proctoring & Monitoring
                </CardTitle>
                <CardDescription>
                  This test is monitored to ensure academic integrity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {proctoringSystems.map((system, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20"
                    >
                      <system.icon className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {system.label}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {system.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Alert className="mt-4 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-sm text-red-800 dark:text-red-200">
                    Any suspicious activity will be flagged and may result in test invalidation.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - System Check & Start */}
          <div className="space-y-6">
            {/* Real-time System Check */}
            <SystemCheckCard />

            {/* Terms Agreement */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Ready to Start?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked: boolean) => setAgreedToTerms(checked)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                  >
                    I have read and understood all the instructions. I agree to follow the test
                    guidelines and understand that any violation may result in disqualification.
                  </label>
                </div>

                <Button
                  onClick={handleStartTest}
                  disabled={!agreedToTerms || isStarting}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="h-5 w-5" />
                  {isStarting ? 'Starting Test...' : 'Start Test Now'}
                </Button>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  The timer will start immediately after clicking the button
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
