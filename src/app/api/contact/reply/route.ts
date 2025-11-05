import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Verify database connection on import
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, reply } = body

    // Validate required fields
    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply is required' },
        { status: 400 }
      )
    }

    // Validate reply length
    if (reply.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Reply is too long. Please keep it under 5000 characters.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get existing message to check if there's already a reply
    const { data: existingMessage } = await supabase
      .from('contact_messages')
      .select('reply, replied_at')
      .eq('id', messageId)
      .single()

    // If there's already a reply, append the new one with a separator
    let newReply = reply.trim()
    if (existingMessage?.reply) {
      const separator = '\n\n---\n\n'
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      newReply = `${existingMessage.reply}${separator}[Additional Reply - ${timestamp}]\n\n${reply.trim()}`
    }

    // Update message with reply
    const { data: updatedMessage, error: updateError } = await supabase
      .from('contact_messages')
      .update({
        reply: newReply,
        status: 'replied',
        replied_at: new Date().toISOString(),
        replied_by: user.id,
      })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating contact message:', updateError)
      return NextResponse.json(
        { error: 'Failed to save reply. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Reply saved successfully',
        data: updatedMessage
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact reply error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

