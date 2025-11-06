import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { functionName, payload } = body

    if (!functionName || !payload) {
      return NextResponse.json({ error: 'Missing functionName or payload' }, { status: 400 })
    }

    // Get Supabase URL and anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const { data: { session } } = await supabase.auth.getSession()

    // Verify we have a valid session
    if (!session?.access_token) {
      return NextResponse.json({ error: 'No valid session found' }, { status: 401 })
    }

    // Call Supabase Edge Function with timeout
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    try {
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use the user's access token for authentication
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          ...payload,
          user_id: user.id,
        }),
        signal: controller.signal,
      }

      // Add better error handling for fetch
      let response: Response
      try {
        response = await fetch(functionUrl, fetchOptions)
      } catch (fetchError: any) {
        // Handle network errors more gracefully
        if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          console.error('❌ Network error - Failed to fetch from Supabase')
          console.error('URL:', functionUrl)
          console.error('Possible causes:')
          console.error('1. Supabase project is paused or deleted')
          console.error('2. Network connectivity issues')
          console.error('3. Incorrect Supabase URL in environment variables')
          console.error('4. CORS configuration issues')
          
          return NextResponse.json(
            { 
              error: 'Network error: Unable to connect to Supabase. Please check your internet connection and Supabase project status.',
              details: 'Failed to fetch from Supabase. Verify your NEXT_PUBLIC_SUPABASE_URL is correct and your project is active.'
            },
            { status: 503 }
          )
        }
        throw fetchError // Re-throw other errors
      }
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return NextResponse.json(
          { error: errorData.error || 'Edge function error' },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - the operation took too long' },
          { status: 504 }
        )
      }
      
      throw fetchError // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

