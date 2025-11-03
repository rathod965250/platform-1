import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface College {
  id: string
  name: string
  location?: string
  type?: string
  is_active: boolean
  display_order: number
}

export function useColleges() {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchColleges = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError, status, statusText } = await supabase
        .from('colleges')
        .select('id, name, location, type, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) {
        // Safely extract error information
        const errorInfo: Record<string, any> = {
          fullError: fetchError
        }
        
        // Only add properties that exist
        if (fetchError && typeof fetchError === 'object') {
          if ('message' in fetchError && fetchError.message) {
            errorInfo.message = fetchError.message
          }
          if ('details' in fetchError && fetchError.details) {
            errorInfo.details = fetchError.details
          }
          if ('hint' in fetchError && fetchError.hint) {
            errorInfo.hint = fetchError.hint
          }
          if ('code' in fetchError && fetchError.code) {
            errorInfo.code = fetchError.code
          }
        }
        
        // Log error info separately to avoid serialization issues
        if (errorInfo.message) console.error('❌ Error fetching colleges - Message:', errorInfo.message)
        if (errorInfo.code) console.error('❌ Error fetching colleges - Code:', errorInfo.code)
        if (errorInfo.details) console.error('❌ Error fetching colleges - Details:', errorInfo.details)
        if (errorInfo.hint) console.error('❌ Error fetching colleges - Hint:', errorInfo.hint)
        if (status || statusText) {
          console.error('❌ Error fetching colleges - Response status:', status, statusText)
        }
        if (Object.keys(errorInfo).length > 1) {
          console.error('❌ Error fetching colleges - Full Error Info:', JSON.stringify(errorInfo, null, 2))
        } else {
          console.error('❌ Error fetching colleges:', errorInfo)
        }
        
        // Check for specific error types
        const errorCode = fetchError && typeof fetchError === 'object' && 'code' in fetchError ? fetchError.code : null
        const errorMessage = fetchError && typeof fetchError === 'object' && 'message' in fetchError ? fetchError.message : null
        
        if (errorCode === '42P01') {
          console.error('❌ Table "colleges" does not exist. Run the migration first.')
        } else if (errorCode === '42501') {
          console.error('❌ Permission denied. Check RLS policies for the colleges table.')
        } else if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('JWT')) {
          console.error('❌ Authentication error. Check Supabase anon key.')
        }

        // Create proper error object for state
        const errorObj = fetchError instanceof Error 
          ? fetchError 
          : new Error(errorMessage || `Failed to fetch colleges${status ? ` (Status: ${status})` : ''}`)
        
        setError(errorObj)
        // Don't clear colleges on error, keep existing data
        return
      }

      setColleges(data || [])
      setError(null)
    } catch (err) {
      // Handle unexpected errors
      const errorInfo: Record<string, any> = {
        fullError: err
      }
      
      if (err && typeof err === 'object') {
        if ('message' in err && err.message) {
          errorInfo.message = err.message
        }
        if ('stack' in err && err.stack) {
          errorInfo.stack = err.stack
        }
      }
      
      // Log error info separately to avoid serialization issues
      if (errorInfo.message) console.error('❌ Unexpected error fetching colleges - Message:', errorInfo.message)
      if (errorInfo.stack) console.error('❌ Unexpected error fetching colleges - Stack:', errorInfo.stack)
      if (Object.keys(errorInfo).length > 1) {
        console.error('❌ Unexpected error fetching colleges - Full Error Info:', JSON.stringify(errorInfo, null, 2))
      } else {
        console.error('❌ Unexpected error fetching colleges:', errorInfo)
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch colleges'))
      // Don't clear colleges on error, keep existing data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let channel: ReturnType<typeof createClient> extends ReturnType<typeof createClient>['channel'] ? any : null = null

    async function setup() {
      try {
        const supabase = createClient()
        
        // Initial fetch
        if (mounted) {
          await fetchColleges()
        }

        // Set up real-time subscription
        channel = supabase
          .channel('colleges-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'colleges',
            },
            async (payload) => {
              if (mounted) {
                console.log('🔄 Colleges realtime event:', payload.eventType)
                // Small delay to ensure database is updated
                await new Promise(resolve => setTimeout(resolve, 100))
                await fetchColleges()
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to colleges realtime')
            } else if (status === 'CHANNEL_ERROR') {
              // Realtime is optional - don't break the app if it fails
              console.warn('⚠️ Colleges realtime channel error - continuing without realtime updates')
              if (err) {
                console.warn('Realtime error details:', err)
              }
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn('⚠️ Colleges realtime subscription status:', status, '- continuing without realtime updates')
            }
          })
      } catch (err) {
        console.error('Error setting up colleges subscription:', err)
      }
    }

    setup()

    return () => {
      mounted = false
      if (channel) {
        const supabase = createClient()
        supabase.removeChannel(channel)
      }
    }
  }, [fetchColleges])

  return { colleges, loading, error, refetch: fetchColleges }
}

