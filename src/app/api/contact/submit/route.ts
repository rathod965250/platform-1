import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Verify database connection on import
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate message length (reasonable limit)
    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long. Please keep it under 5000 characters.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check if user is authenticated (optional - for linking to profile)
    const { data: { user } } = await supabase.auth.getUser()

    // Insert contact message into database
    const { data: contactMessage, error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        user_id: user?.id || null,
        status: 'new',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating contact message:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit message. Please try again later.' },
        { status: 500 }
      )
    }

    // TODO: Send email notification to admin (see implementation plan below)
    // TODO: Send confirmation email to user (see implementation plan below)

    return NextResponse.json(
      { 
        message: 'Your message has been received! We will get back to you soon.',
        id: contactMessage.id
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

