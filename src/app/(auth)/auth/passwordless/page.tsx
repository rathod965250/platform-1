'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, CheckCircle2, Mail, Zap, ArrowRight } from 'lucide-react'

export default function PasswordlessLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setIsSuccess(true)
      toast.success('Check your email for the login link!')
    } catch (error: any) {
      console.error('Passwordless login error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            Passwordless Login
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in with a magic link sent to your email
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We've sent you a magic link. Click the link in the email to sign in to your account.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setEmail('')
                  setIsSuccess(false)
                }}
                variant="outline"
                className="w-full border-border"
              >
                Send another link
              </Button>
              <Link href="/login">
                <Button variant="outline" className="w-full border-border">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    className="pl-9 bg-background"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-foreground hover:bg-foreground/90 text-background"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send magic link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <Link href="/login">
              <Button variant="outline" className="w-full border-border">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
