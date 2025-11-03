'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Lock, ArrowRight, Zap, Check, X } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be authenticated to change your password')
        router.push('/login')
        return
      }
      
      setIsAuthenticated(true)
    }
    
    checkAuth()
  }, [router])

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
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
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

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated successfully!')
      router.push('/dashboard')
      router.refresh()

    } catch (error: any) {
      console.error('Update password error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Zap className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold text-foreground tracking-tight">
              CrackAtom
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Update Password
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
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
            disabled={isLoading || !isPasswordStrong || !passwordsMatch}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Update password
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

