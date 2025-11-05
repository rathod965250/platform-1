import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login | CrackAtom',
  description: 'Login to your CrackAtom account to access practice tests, mock exams, and adaptive practice sessions',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
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
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
            Login to continue your preparation journey
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
