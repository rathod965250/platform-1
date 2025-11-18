import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const code = requestUrl.searchParams.get('code') // For OAuth flows

  // Create redirect URL without auth parameters
  const redirectTo = new URL(requestUrl.origin)
  redirectTo.pathname = next
  // Copy search params and remove auth-related ones
  requestUrl.searchParams.forEach((value, key) => {
    if (!['token_hash', 'type', 'next', 'code'].includes(key)) {
      redirectTo.searchParams.set(key, value)
    }
  })

  // Handle PKCE flow (token_hash for email confirmation, password reset, etc.)
  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(redirectTo.toString())
    }
  }

  // Handle OAuth flow (code exchange)
  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError)
      const errorUrl = new URL(`${requestUrl.origin}/auth/error`)
      errorUrl.searchParams.set('error', exchangeError.message)
      return NextResponse.redirect(errorUrl.toString())
    }

    // Get user after successful exchange
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting user after OAuth:', userError)
      const errorUrl = new URL(`${requestUrl.origin}/auth/error`)
      errorUrl.searchParams.set('error', 'Failed to retrieve user information')
      return NextResponse.redirect(errorUrl.toString())
    }

    // Extract Google user metadata
    const googleName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.user_metadata?.display_name ||
                      user.user_metadata?.email?.split('@')[0] || 
                      ''
    const googleEmail = user.email || user.user_metadata?.email || ''
    const googleAvatar = user.user_metadata?.avatar_url || 
                        user.user_metadata?.picture || 
                        null

    // Check if profile exists (should be created by trigger)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', user.id)
      .single()

    // Update profile with Google metadata if needed
    if (existingProfile) {
      // Update profile if we have Google metadata that's missing
      const updates: {
        full_name?: string
        email?: string
        avatar_url?: string | null
      } = {}

      if (googleName && !existingProfile.full_name) {
        updates.full_name = googleName
      }
      
      if (googleEmail && !existingProfile.email) {
        updates.email = googleEmail
      }
      
      if (googleAvatar && !existingProfile.avatar_url) {
        updates.avatar_url = googleAvatar
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
      }
    } else {
      // If profile doesn't exist (shouldn't happen with trigger), create it
      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: googleEmail,
          full_name: googleName,
          avatar_url: googleAvatar,
          role: 'student',
        })
    }

    // Check if user needs onboarding (new user or incomplete profile)
    const { data: profile } = await supabase
      .from('profiles')
      .select('college, graduation_year, target_companies, phone, course_id, course_name')
      .eq('id', user.id)
      .single()

    const { data: adaptiveStates } = await supabase
      .from('adaptive_state')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    // Comprehensive onboarding completion check
    const hasCollege = !!profile?.college
    const hasGraduationYear = !!profile?.graduation_year
    const hasCourse = !!(profile?.course_id || profile?.course_name)
    const hasPhone = !!profile?.phone
    const hasTargetCompanies = !!(
      profile?.target_companies && 
      Array.isArray(profile.target_companies) && 
      profile.target_companies.length > 0
    )
    const hasAdaptiveState = !!(adaptiveStates && adaptiveStates.length > 0)

    const isComplete = hasCollege && 
                       hasGraduationYear && 
                       hasCourse && 
                       hasPhone && 
                       hasTargetCompanies && 
                       hasAdaptiveState

    // If onboarding is incomplete, redirect to onboarding
    if (!isComplete) {
      const onboardingUrl = new URL(`${requestUrl.origin}/onboarding`)
      return NextResponse.redirect(onboardingUrl.toString())
    }

    return NextResponse.redirect(redirectTo.toString())
  }

  // If neither token_hash nor code, redirect to error page
  const errorUrl = new URL(`${requestUrl.origin}/auth/error`)
  return NextResponse.redirect(errorUrl.toString())
}
