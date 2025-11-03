import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// This route handles email confirmation, password reset, and magic link verification
// Used when email templates use token_hash instead of code
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Success - redirect to specified page or dashboard
      const redirectUrl = new URL(request.url)
      redirectUrl.pathname = next
      redirectUrl.searchParams.delete('token_hash')
      redirectUrl.searchParams.delete('type')
      redirectUrl.searchParams.delete('next')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Error - redirect to error page
  const redirectUrl = new URL(request.url)
  redirectUrl.pathname = '/auth/error'
  return NextResponse.redirect(redirectUrl)
}

