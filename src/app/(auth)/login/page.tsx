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
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">
            Login to continue your preparation journey
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
