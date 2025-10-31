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

export function SimpleSignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validation
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

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    console.log('📝 Starting signup process...')
    console.log('📧 Email:', email)
    console.log('👤 Name:', fullName)

    try {
      const supabase = createClient()

      // Attempt signup
      console.log('🚀 Creating account...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log('📥 Signup response:', {
        success: !authError,
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        error: authError?.message
      })

      if (authError) {
        console.error('❌ Signup error:', authError)
        
        if (authError.message.includes('already registered')) {
          toast.error('This email is already registered. Try logging in instead.')
        } else {
          toast.error(authError.message)
        }
        return
      }

      if (!authData.user) {
        console.error('❌ No user data returned')
        toast.error('Signup failed. Please try again.')
        return
      }

      console.log('✅ Account created!')
      console.log('👤 User ID:', authData.user.id)

      // Update profile with full name
      if (authData.user.id) {
        console.log('📋 Updating profile...')
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', authData.user.id)

        if (profileError) {
          console.warn('⚠️ Profile update error:', profileError.message)
        } else {
          console.log('✅ Profile updated')
        }
      }

      // Check if email confirmation is required
      if (authData.user.identities && authData.user.identities.length === 0) {
        toast.success('Account created! Please check your email to confirm your account.')
        console.log('📧 Email confirmation required')
      } else {
        toast.success('Account created successfully! You can now log in.')
        console.log('✅ Account ready to use')
      }

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to login
      console.log('🔄 Redirecting to login...')
      router.push('/login')

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
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="name"
          />
        </div>

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
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-500">
            Must be at least 8 characters long
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Sign up'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Log in
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
