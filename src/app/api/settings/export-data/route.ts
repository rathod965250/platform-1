import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all user data
    const [profile, testAttempts, practiceSessions, userAnalytics, userMetrics, adaptiveStates] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('test_attempts').select('*').eq('user_id', user.id),
      supabase.from('practice_sessions').select('*').eq('user_id', user.id),
      supabase.from('user_analytics').select('*').eq('user_id', user.id),
      supabase.from('user_metrics').select('*').eq('user_id', user.id).limit(1000),
      supabase.from('adaptive_state').select('*').eq('user_id', user.id),
    ])

    // Combine all data
    const userData = {
      profile: profile.data,
      testAttempts: testAttempts.data,
      practiceSessions: practiceSessions.data,
      userAnalytics: userAnalytics.data,
      userMetrics: userMetrics.data,
      adaptiveStates: adaptiveStates.data,
      exportedAt: new Date().toISOString(),
    }

    // Return JSON response
    return NextResponse.json(userData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="crackatom-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Error in export data API:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

