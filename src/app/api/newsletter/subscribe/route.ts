import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
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

    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Check if email already exists
    const { data: existingSubscription } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, is_active')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existingSubscription) {
      if (existingSubscription.is_active) {
        return NextResponse.json(
          { 
            message: 'You are already subscribed to our newsletter!',
            alreadySubscribed: true 
          },
          { status: 200 }
        )
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('newsletter_subscriptions')
          .update({
            is_active: true,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            user_id: user?.id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)

        if (updateError) {
          console.error('Error reactivating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to reactivate subscription' },
            { status: 500 }
          )
        }

        return NextResponse.json(
          { 
            message: 'Welcome back! Your subscription has been reactivated.',
            reactivated: true 
          },
          { status: 200 }
        )
      }
    }

    // Create new subscription
    const { data: subscription, error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: email.trim().toLowerCase(),
        is_active: true,
        source: 'footer',
        user_id: user?.id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Successfully subscribed to newsletter!',
        subscription: {
          id: subscription.id,
          email: subscription.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: subscription } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, is_active, subscribed_at')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!subscription) {
      return NextResponse.json(
        { subscribed: false },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        subscribed: subscription.is_active,
        subscription: {
          email: subscription.email,
          subscribed_at: subscription.subscribed_at
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Newsletter check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

