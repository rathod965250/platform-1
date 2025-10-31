'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface StartTestButtonProps {
  testId: string
}

export function StartTestButton({ testId }: StartTestButtonProps) {
  const [agreed, setAgreed] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleStartTest = async () => {
    if (!agreed) {
      toast.error('Please read and agree to the instructions')
      return
    }

    setIsStarting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Fetch test and questions
      const { data: test, error: testError } = await supabase
        .from('tests')
        .select('*, questions(*)')
        .eq('id', testId)
        .single()

      if (testError || !test) throw new Error('Test not found')
      if (!test.questions || test.questions.length === 0) {
        throw new Error('No questions available')
      }

      // Create test attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('test_attempts')
        .insert({
          user_id: user.id,
          test_id: testId,
          total_questions: test.questions.length,
          score: 0,
          correct_answers: 0,
          skipped_count: 0,
          marked_for_review_count: 0,
          time_taken_seconds: 0,
        })
        .select()
        .single()

      if (attemptError || !attempt) throw new Error('Failed to create test attempt')

      // Navigate to active test
      router.push(`/test/${testId}/active/${attempt.id}`)
    } catch (error: any) {
      console.error('Error starting test:', error)
      toast.error(error.message || 'Failed to start test')
      setIsStarting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="agree"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked as boolean)}
        />
        <Label
          htmlFor="agree"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          I have read and understood all instructions
        </Label>
      </div>
      <Button
        onClick={handleStartTest}
        disabled={!agreed || isStarting}
        className="w-full"
        size="lg"
      >
        {isStarting ? 'Starting Test...' : 'Start Test'}
      </Button>
    </div>
  )
}

