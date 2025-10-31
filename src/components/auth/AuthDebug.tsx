'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthDebug() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const supabase = createClient()
      
      try {
        // Check environment variables
        const hasUrl = typeof window !== 'undefined' ? !!process.env.NEXT_PUBLIC_SUPABASE_URL : false
        const hasKey = typeof window !== 'undefined' ? !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : false
        
        // Check session
        const { data: sessionData } = await supabase.auth.getSession()
        
        // Try to access profiles table
        const { error: profilesError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)

        setStatus({
          config: {
            hasUrl,
            hasKey,
            url: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' : ''
          },
          session: {
            active: !!sessionData.session,
            user: sessionData.session?.user?.email
          },
          database: {
            accessible: !profilesError,
            error: profilesError?.message
          }
        })
      } catch (error: any) {
        setStatus({ error: error.message })
      }
    }

    checkStatus()
  }, [])

  if (!status) return null

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
      <summary className="cursor-pointer font-semibold">Debug Info (Dev Only)</summary>
      <pre className="mt-2 overflow-auto">
        {JSON.stringify(status, null, 2)}
      </pre>
    </details>
  )
}
