import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are missing, return response without Supabase session update
  // This prevents the middleware from crashing and allows the app to continue
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables')
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
    console.error('\nPlease check your .env.local file and ensure both variables are set.')
    // Return response without Supabase session update to avoid crashing
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && request.nextUrl.pathname.startsWith('/practice')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && request.nextUrl.pathname.startsWith('/test')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && request.nextUrl.pathname.startsWith('/profile')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect completed users away from onboarding page
  // Redirect incomplete users away from protected routes (except onboarding)
  if (user) {
    const protectedRoutes = ['/dashboard', '/practice', '/test', '/profile']
    const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
    const isOnboardingRoute = request.nextUrl.pathname === '/onboarding'

    if (isProtectedRoute || isOnboardingRoute) {
      try {
        // Optimized: Fetch both profile and adaptive_state in parallel
        const [profileResult, adaptiveStateResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('college, graduation_year, target_companies, phone, course_id, course_name')
            .eq('id', user.id)
            .single(),
          supabase
            .from('adaptive_state')
            .select('id')
            .eq('user_id', user.id)
            .limit(1),
        ])

        const profile = profileResult.data
        const adaptiveStates = adaptiveStateResult.data

        // Check if all required fields are present
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

        // If onboarding is incomplete and accessing protected route, redirect to onboarding
        if (!isComplete && isProtectedRoute) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }

        // If onboarding is complete and accessing onboarding page, redirect to dashboard
        if (isComplete && isOnboardingRoute) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          return NextResponse.redirect(url)
        }
      } catch (error) {
        // If check fails, log error but don't redirect to avoid loops
        // Only redirect if it's a protected route and the error suggests missing profile
        console.error('Error checking onboarding status in middleware:', error)
        // For protected routes, allow access on error (fail open) to avoid redirect loops
        // The page-level checks will handle incomplete onboarding
        if (isProtectedRoute && error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
          // Profile not found - definitely incomplete
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
        // Otherwise, let the request continue - page-level checks will handle it
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

