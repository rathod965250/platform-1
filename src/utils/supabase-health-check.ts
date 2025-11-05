/**
 * Utility to check Supabase connection health
 * Use this to diagnose connection issues
 */

export async function checkSupabaseHealth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const health = {
    envVars: {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing',
    },
    urlFormat: {
      valid: false,
      startsWithHttp: false,
      containsSupabase: false,
    },
    connectivity: {
      reachable: false,
      status: 'unknown',
      error: null as string | null,
    },
  }

  // Check environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ...health,
      error: 'Missing environment variables',
    }
  }

  // Check URL format
  health.urlFormat.startsWithHttp = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')
  health.urlFormat.containsSupabase = supabaseUrl.includes('supabase.co')
  health.urlFormat.valid = health.urlFormat.startsWithHttp && health.urlFormat.containsSupabase

  // Test connectivity
  try {
    const testUrl = `${supabaseUrl}/rest/v1/`
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      // Add timeout
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    health.connectivity.reachable = true
    health.connectivity.status = response.status.toString()
  } catch (error) {
    health.connectivity.reachable = false
    health.connectivity.error = error instanceof Error ? error.message : 'Unknown error'
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        health.connectivity.error = 'Connection timeout - Supabase URL might be unreachable'
      } else if (error.message.includes('Failed to fetch')) {
        health.connectivity.error = 'Network error - Check your internet connection and Supabase project status'
      } else {
        health.connectivity.error = error.message
      }
    }
  }

  return health
}

