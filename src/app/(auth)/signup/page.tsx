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
            Create an Account
          </h1>
          <p className="text-muted-foreground mt-2">
            Start your preparation journey today
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  )
}
