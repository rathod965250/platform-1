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
  const redirectTo = requestUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')
  redirectTo.searchParams.delete('code')

  // Handle PKCE flow (token_hash for email confirmation, password reset, etc.)
  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Handle OAuth flow (code exchange)
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user was created and update profile if needed
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Profile is automatically created by trigger, but we can verify
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // If profile doesn't exist (shouldn't happen with trigger), create it
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            role: 'student',
          })
      }
    }

    // Check if user needs onboarding (new user or incomplete profile)
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('college, graduation_year, target_companies')
        .eq('id', user.id)
        .single()

      const { data: adaptiveStates } = await supabase
        .from('adaptive_state')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      // If profile is incomplete or no adaptive_state exists, redirect to onboarding
      const needsOnboarding = !profile?.college || !profile?.graduation_year || 
                              !profile?.target_companies || 
                              profile.target_companies.length === 0 ||
                              !adaptiveStates || adaptiveStates.length === 0

      if (needsOnboarding) {
        redirectTo.pathname = '/onboarding'
        redirectTo.searchParams.delete('code')
        return NextResponse.redirect(redirectTo)
      }
    }

    redirectTo.searchParams.delete('code')
    return NextResponse.redirect(redirectTo)
  }

  // If neither token_hash nor code, redirect to error page
  redirectTo.pathname = '/auth/error'
  return NextResponse.redirect(redirectTo)
}
