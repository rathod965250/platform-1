import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign Up | CrackAtom',
  description: 'Create a free account to start practicing for placement aptitude tests with AI-powered adaptive practice and mock tests',
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupPage() {
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
            Create an Account
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
            Start your preparation journey today
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  )
}
