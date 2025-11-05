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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 sm:gap-2.5 mb-4 sm:mb-6 group min-h-[44px]">
            <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary transition-transform group-hover:scale-110 shrink-0" />
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              CrackAtom
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2 sm:mb-3">
            Passwordless Login
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
            Sign in with a magic link sent to your email
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-5 sm:space-y-6 md:space-y-6 text-center">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <div className="space-y-2 sm:space-y-2.5">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Check your email</h2>
              <p className="text-sm sm:text-base md:text-base text-muted-foreground">
                We've sent you a magic link. Click the link in the email to sign in to your account.
              </p>
            </div>
            <div className="space-y-2 sm:space-y-2.5">
              <Button
                onClick={() => {
                  setEmail('')
                  setIsSuccess(false)
                }}
                variant="outline"
                className="w-full border-border text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12"
              >
                Send another link
              </Button>
              <Link href="/login">
                <Button variant="outline" className="w-full border-border text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12">
                  <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6 md:space-y-6">
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
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    className="pl-9 sm:pl-11 md:pl-11 bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12"
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
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            </form>

            <Link href="/login">
              <Button variant="outline" className="w-full border-border text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12">
                <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Back to login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
