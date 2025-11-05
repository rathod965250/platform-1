import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { preferenceType, preferences } = body

    if (!preferenceType || !preferences) {
      return NextResponse.json(
        { error: 'Missing preferenceType or preferences' },
        { status: 400 }
      )
    }

    // Validate preference type
    const validTypes = ['dashboard_preferences', 'notification_preferences', 'test_preferences', 'appearance_preferences', 'privacy_preferences']
    if (!validTypes.includes(preferenceType)) {
      return NextResponse.json(
        { error: 'Invalid preference type' },
        { status: 400 }
      )
    }

    // Update preferences
    const { error } = await supabase
      .from('profiles')
      .update({ [preferenceType]: preferences })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in preferences update API:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

