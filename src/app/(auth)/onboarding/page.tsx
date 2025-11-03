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
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast.error('Please sign in to continue')
          router.push('/login')
          return
        }
        
        // Check if user already completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('college, graduation_year, target_companies, phone')
          .eq('id', user.id)
          .single()

        // Check if profile is already filled (has college, graduation_year, etc.)
        // and if adaptive_state exists
        const { data: adaptiveStates } = await supabase
          .from('adaptive_state')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        // If profile has key info and adaptive_state exists, onboarding is complete
        if (profile?.college && profile?.graduation_year && adaptiveStates && adaptiveStates.length > 0) {
          toast.info('You have already completed onboarding')
          router.push('/dashboard')
          return
        }

        setIsAuthenticated(true)
      } catch (error: any) {
        console.error('Onboarding check error:', error)
        toast.error('An error occurred. Please try again.')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

