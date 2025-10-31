import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free account to start practicing for placement aptitude tests with AI-powered adaptive practice and mock tests',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sign Up | Aptitude Preparation Platform',
    description: 'Create a free account to start practicing for placement aptitude tests',
    type: 'website',
  },
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Aptitude Platform
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create an Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Start your preparation journey today
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up for free</CardTitle>
            <CardDescription>
              Get started with practice tests and mock exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

