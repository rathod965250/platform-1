'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, User, Mail, Lock, ArrowRight, Check, X } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Password strength validation
  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!isPasswordStrong) {
      toast.error('Password does not meet strength requirements')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('This email is already registered. Try logging in instead.')
        } else {
          toast.error(authError.message)
        }
        return
      }

      if (!authData.user) {
        toast.error('Signup failed. Please try again.')
        return
      }

      // Update profile with full name (trigger creates profile, but we update it)
      if (authData.user.id) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', authData.user.id)
      }

      // Check if email confirmation is required
      if (authData.user.identities && authData.user.identities.length === 0) {
        toast.success('Account created! Please check your email to confirm your account.')
        router.push('/auth/confirm-email')
      } else {
        toast.success('Account created successfully!')
        // Redirect to onboarding for new users
        router.push('/onboarding')
        router.refresh()
      }

    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
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
        toast.error(error.message || 'Failed to initiate Google signup')
        setIsGoogleLoading(false)
      } else if (data?.url) {
        // For client-side redirect, the browser will handle it
        // The OAuth flow will redirect automatically
        window.location.href = data.url
      }
      // Don't set loading to false here as the page will redirect
    } catch (error: any) {
      console.error('Google signup error:', error)
      toast.error('An error occurred during Google signup. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-5">
        <div className="space-y-2 sm:space-y-2.5">
          <Label htmlFor="fullName" className="text-sm sm:text-base md:text-base text-foreground">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="name"
              className="pl-9 sm:pl-11 md:pl-11 bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
            />
          </div>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          <Label htmlFor="email" className="text-sm sm:text-base md:text-base text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="email"
              className="pl-9 sm:pl-11 md:pl-11 bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
            />
          </div>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          <Label htmlFor="password" className="text-sm sm:text-base md:text-base text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="new-password"
              className="pl-9 sm:pl-11 md:pl-11 bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
            />
          </div>
          {password && (
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-sm text-muted-foreground pt-1 sm:pt-1.5">
              <div className="flex items-center gap-2 min-h-[44px]">
                {passwordStrength.length ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                )}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2 min-h-[44px]">
                {passwordStrength.uppercase ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                )}
                <span>One uppercase letter</span>
              </div>
              <div className="flex items-center gap-2 min-h-[44px]">
                {passwordStrength.lowercase ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                )}
                <span>One lowercase letter</span>
              </div>
              <div className="flex items-center gap-2 min-h-[44px]">
                {passwordStrength.number ? (
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                )}
                <span>One number</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          <Label htmlFor="confirmPassword" className="text-sm sm:text-base md:text-base text-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="new-password"
              className="pl-9 sm:pl-11 md:pl-11 bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
            />
          </div>
          {confirmPassword && (
            <div className="text-xs sm:text-sm md:text-sm pt-1 sm:pt-1.5 min-h-[44px] flex items-center">
              {passwordsMatch ? (
                <span className="text-primary flex items-center gap-1.5 sm:gap-2">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Passwords match
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1.5 sm:gap-2">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12"
          disabled={isLoading || isGoogleLoading || !isPasswordStrong || !passwordsMatch}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm md:text-sm uppercase">
          <span className="bg-background px-2 sm:px-3 md:px-3 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-border hover:bg-accent/50 hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12"
        onClick={handleGoogleSignup}
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
            Sign up with Google
          </>
        )}
      </Button>

      <p className="text-center text-sm sm:text-base md:text-base text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline transition-colors min-h-[44px] inline-flex items-center px-2">
          Log in
        </Link>
      </p>
    </div>
  )
}
