'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function TestAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Test 1: Check Supabase URL and Key
      const url = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : ''
      const hasKey = typeof window !== 'undefined' ? !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : false
      
      setResult((prev: any) => ({
        ...prev,
        config: { url, hasKey }
      }))

      // Test 2: Try to fetch from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      setResult((prev: any) => ({
        ...prev,
        profilesTest: {
          success: !profilesError,
          error: profilesError?.message,
          data: profiles
        }
      }))

      // Test 3: Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      setResult((prev: any) => ({
        ...prev,
        session: {
          hasSession: !!sessionData.session,
          user: sessionData.session?.user?.email,
          error: sessionError?.message
        }
      }))

    } catch (error: any) {
      setResult((prev: any) => ({
        ...prev,
        error: error.message
      }))
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      setResult((prev: any) => ({
        ...prev,
        login: {
          success: !error,
          error: error?.message,
          user: data.user?.email,
          session: !!data.session
        }
      }))
    } catch (error: any) {
      setResult((prev: any) => ({
        ...prev,
        loginError: error.message
      }))
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      setResult((prev: any) => ({
        ...prev,
        signup: {
          success: !error,
          error: error?.message,
          user: data.user?.email,
          needsConfirmation: data.user?.identities?.length === 0
        }
      }))
    } catch (error: any) {
      setResult((prev: any) => ({
        ...prev,
        signupError: error.message
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Connection</h2>
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test Supabase Connection'}
        </Button>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
          <div className="flex gap-4">
            <Button onClick={testSignup} disabled={loading}>
              Test Signup
            </Button>
            <Button onClick={testLogin} disabled={loading}>
              Test Login
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}
