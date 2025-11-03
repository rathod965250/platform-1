'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, ArrowRight, Chrome } from 'lucide-react'

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

      toast.success(`Welcome back${profile?.full_name ? ', ' + profile.full_name : ''}!`)
      
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

      // Redirect based on onboarding status
      if (isComplete) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
      
      router.refresh()

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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        toast.error(error.message)
        setIsGoogleLoading(false)
      }
      // Don't set loading to false here as the page will redirect
    } catch (error: any) {
      console.error('Google login error:', error)
      toast.error('An error occurred during Google login')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="email"
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="current-password"
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-foreground hover:bg-foreground/90 text-background"
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-border hover:bg-accent/50"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </>
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline transition-colors">
            Sign up
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          <Link href="/auth/passwordless" className="text-primary hover:underline transition-colors">
            Sign in with email link (passwordless)
          </Link>
        </p>
      </div>
    </div>
  )
}
