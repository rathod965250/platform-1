'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, User, Mail, Lock, ArrowRight, Chrome, Check, X } from 'lucide-react'

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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="name"
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="email"
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="new-password"
              className="pl-9 bg-background"
            />
          </div>
          {password && (
            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                {passwordStrength.length ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <X className="h-3 w-3 text-destructive" />
                )}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                {passwordStrength.uppercase ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <X className="h-3 w-3 text-destructive" />
                )}
                <span>One uppercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                {passwordStrength.lowercase ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <X className="h-3 w-3 text-destructive" />
                )}
                <span>One lowercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                {passwordStrength.number ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <X className="h-3 w-3 text-destructive" />
                )}
                <span>One number</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
              autoComplete="new-password"
              className="pl-9 bg-background"
            />
          </div>
          {confirmPassword && (
            <div className="text-xs pt-1">
              {passwordsMatch ? (
                <span className="text-primary flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Passwords match
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-foreground hover:bg-foreground/90 text-background"
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
        onClick={handleGoogleSignup}
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
            Sign up with Google
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline transition-colors">
          Log in
        </Link>
      </p>
    </div>
  )
}
