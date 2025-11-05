import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
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

    // Note: Deleting a user account requires admin privileges
    // In production, this should be handled by an admin function
    // For now, we'll return an error indicating admin privileges are needed
    // The actual deletion should be done via Supabase Admin API or a server-side admin function

    return NextResponse.json(
      { error: 'Account deletion requires admin privileges. Please contact support.' },
      { status: 403 }
    )

    // In production, you would implement actual deletion like this:
    // const { data: { session } } = await supabase.auth.getSession()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // 
    // // Use Supabase Admin API to delete user
    // // This requires SUPABASE_SERVICE_ROLE_KEY
    // const adminSupabase = createAdminClient()
    // const { error } = await adminSupabase.auth.admin.deleteUser(user.id)
    // 
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 })
    // }
    // 
    // return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete account API:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

