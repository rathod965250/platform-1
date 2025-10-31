'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function SimpleLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Basic validation
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    console.log('🔐 Starting login process...')
    console.log('📧 Email:', email)

    try {
      const supabase = createClient()
      
      // Test connection first
      console.log('🔌 Testing Supabase connection...')
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      console.log('📊 Existing session:', existingSession ? 'Found' : 'None')

      // Attempt login
      console.log('🚀 Attempting login...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log('📥 Login response:', {
        success: !authError,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: authError?.message
      })

      if (authError) {
        console.error('❌ Login error:', authError)
        
        // Provide helpful error messages
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.')
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Please confirm your email address before logging in.')
        } else {
          toast.error(authError.message)
        }
        return
      }

      if (!authData.user) {
        console.error('❌ No user data returned')
        toast.error('Login failed. Please try again.')
        return
      }

      console.log('✅ Login successful!')
      console.log('👤 User:', authData.user.email)
      console.log('🎫 Session:', authData.session ? 'Created' : 'None')

      // Fetch user profile from database
      console.log('📋 Fetching user profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.warn('⚠️ Profile fetch error:', profileError.message)
        toast.warning('Logged in, but could not load profile. Continuing anyway...')
      } else {
        console.log('✅ Profile loaded:', {
          email: profile.email,
          role: profile.role,
          name: profile.full_name
        })
      }

      // Show success message
      toast.success(`Welcome back${profile?.full_name ? ', ' + profile.full_name : ''}!`)

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to dashboard
      console.log('🔄 Redirecting to dashboard...')
      router.push('/dashboard')
      router.refresh()

    } catch (error: any) {
      console.error('💥 Unexpected error:', error)
      toast.error(error?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Log in'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>

      {/* Debug info in development */}
      {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && (
        <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <summary className="cursor-pointer font-semibold mb-2">🔍 Debug Info</summary>
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            <p>• Supabase URL: {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40)}...</p>
            <p>• Has Anon Key: {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
            <p>• Check browser console (F12) for detailed logs</p>
          </div>
        </details>
      )}
    </div>
  )
}
