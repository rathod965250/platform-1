'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.')
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Please confirm your email address before logging in.')
        } else {
          toast.error(authError.message)
        }
        return
      }

      if (!authData.user) {
        toast.error('Login failed. Please try again.')
        return
      }

      // Fetch user profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, college, graduation_year, target_companies, phone, course_id, course_name')
        .eq('id', authData.user.id)
        .single()

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

      // Check for adaptive_state
      const { data: adaptiveStates } = await supabase
        .from('adaptive_state')
        .select('id')
        .eq('user_id', authData.user.id)
        .limit(1)

      const hasAdaptiveState = !!(adaptiveStates && adaptiveStates.length > 0)

      const isComplete = hasCollege && 
                         hasGraduationYear && 
                         hasCourse && 
                         hasPhone && 
                         hasTargetCompanies && 
                         hasAdaptiveState

      toast.success(`Welcome back${profile?.full_name ? ', ' + profile.full_name : ''}!`)
      
      // Refresh router to ensure session is propagated
      router.refresh()
      
      // Small delay to ensure session is established before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect based on onboarding status
      if (isComplete) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }

    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    
    try {
      const supabase = createClient()
      
      // Get the current origin for redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google OAuth error:', error)
        toast.error(error.message || 'Failed to initiate Google login')
        setIsGoogleLoading(false)
      } else if (data?.url) {
        // For client-side redirect, the browser will handle it
        // The OAuth flow will redirect automatically
        window.location.href = data.url
      }
      // Don't set loading to false here as the page will redirect
    } catch (error: any) {
      console.error('Google login error:', error)
      toast.error('An error occurred during Google login. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full border-border hover:bg-accent/50 hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12 cursor-pointer"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg
              className="mr-3 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm md:text-sm uppercase">
          <span className="bg-background px-2 sm:px-3 md:px-3 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-5">
        <div className="space-y-2 sm:space-y-2.5">
          <Label htmlFor="email" className="text-sm sm:text-base md:text-base text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="email"
              className="pl-9 sm:pl-11 md:pl-11 bg-card border-border text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
            />
          </div>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm sm:text-base md:text-base text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm sm:text-base md:text-base text-primary hover:underline transition-colors min-h-[44px] flex items-center px-2"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="current-password"
              className="pl-9 sm:pl-11 md:pl-11 bg-card border-border text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#673DE6] hover:bg-[#5a34cc] text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Log in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="text-center space-y-2 sm:space-y-2.5">
        <p className="text-sm sm:text-base md:text-base text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline transition-colors min-h-[44px] inline-flex items-center px-2">
            Sign up
          </Link>
        </p>
        <p className="text-sm sm:text-base md:text-base text-muted-foreground">
          <Link href="/auth/passwordless" className="text-primary hover:underline transition-colors min-h-[44px] inline-flex items-center px-2">
            Sign in with email link (passwordless)
          </Link>
        </p>
      </div>
    </div>
  )
}
