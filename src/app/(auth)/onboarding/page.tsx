'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'
import { Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const supabase = createClient()
        
        // Retry logic to handle session propagation delay
        let user = null
        let attempts = 0
        const maxAttempts = 3
        
        while (attempts < maxAttempts && !user && mounted) {
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          user = currentUser
          
          if (!user && attempts < maxAttempts - 1) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 300))
          }
          attempts++
        }
        
        if (!mounted) return
        
        if (!user) {
          toast.error('Please sign in to continue')
          router.push('/login')
          return
        }
        
        // Check if user already completed onboarding with comprehensive check
        const { data: profile } = await supabase
          .from('profiles')
          .select('college, graduation_year, target_companies, phone, course_id, course_name')
          .eq('id', user.id)
          .single()

        if (!mounted) return

        // Check if adaptive_state exists
        const { data: adaptiveStates } = await supabase
          .from('adaptive_state')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (!mounted) return

        // Comprehensive onboarding completion check
        const hasCollege = !!profile?.college
        const hasGraduationYear = !!profile?.graduation_year
        const hasCourse = !!(profile?.course_id || profile?.course_name)
        const hasPhone = !!profile?.phone
        const hasTargetCompanies = !!(
          profile?.target_companies && 
          Array.isArray(profile.target_companies) && 
          profile.target_companies.length > 0
        )
        const hasAdaptiveState = !!(adaptiveStates && adaptiveStates.length > 0)

        const isComplete = hasCollege && 
                           hasGraduationYear && 
                           hasCourse && 
                           hasPhone && 
                           hasTargetCompanies && 
                           hasAdaptiveState

        // If onboarding is complete, redirect to dashboard
        if (isComplete) {
          toast.info('You have already completed onboarding')
          router.push('/dashboard')
          return
        }

        if (mounted) {
          setIsAuthenticated(true)
        }
      } catch (error: any) {
        console.error('Onboarding check error:', error)
        if (mounted) {
          toast.error('An error occurred. Please try again.')
          router.push('/login')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Zap className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold text-foreground tracking-tight">
              CrackAtom
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Welcome to CrackAtom! 🎉
          </h1>
          <p className="text-muted-foreground">
            Let's set up your profile to personalize your learning experience
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  )
}

