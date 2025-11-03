import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Course {
  id: string
  name: string
  code?: string
  degree_type?: string
  is_active: boolean
  display_order: number
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCourses = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError, status, statusText } = await supabase
        .from('courses')
        .select('id, name, code, degree_type, is_active, display_order')
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
        if (errorInfo.message) console.error('❌ Error fetching courses - Message:', errorInfo.message)
        if (errorInfo.code) console.error('❌ Error fetching courses - Code:', errorInfo.code)
        if (errorInfo.details) console.error('❌ Error fetching courses - Details:', errorInfo.details)
        if (errorInfo.hint) console.error('❌ Error fetching courses - Hint:', errorInfo.hint)
        if (Object.keys(errorInfo).length > 1) {
          console.error('❌ Error fetching courses - Full Error Info:', JSON.stringify(errorInfo, null, 2))
        } else {
          console.error('❌ Error fetching courses:', errorInfo)
        }
        
        // Check for specific error types
        const errorCode = fetchError && typeof fetchError === 'object' && 'code' in fetchError ? fetchError.code : null
        const errorMessage = fetchError && typeof fetchError === 'object' && 'message' in fetchError ? fetchError.message : null
        
        if (errorCode === '42P01') {
          console.error('❌ Table "courses" does not exist. Run the migration first.')
        } else if (errorCode === '42501') {
          console.error('❌ Permission denied. Check RLS policies for the courses table.')
        } else if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('JWT')) {
          console.error('❌ Authentication error. Check Supabase anon key.')
        }
        
        if (status || statusText) {
          console.error('Response status:', status, statusText)
        }

        // Create proper error object for state
        const errorObj = fetchError instanceof Error 
          ? fetchError 
          : new Error(errorMessage || `Failed to fetch courses${status ? ` (Status: ${status})` : ''}`)
        
        setError(errorObj)
        // Don't clear courses on error, keep existing data
        return
      }

      setCourses(data || [])
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
      if (errorInfo.message) console.error('❌ Unexpected error fetching courses - Message:', errorInfo.message)
      if (errorInfo.stack) console.error('❌ Unexpected error fetching courses - Stack:', errorInfo.stack)
      if (Object.keys(errorInfo).length > 1) {
        console.error('❌ Unexpected error fetching courses - Full Error Info:', JSON.stringify(errorInfo, null, 2))
      } else {
        console.error('❌ Unexpected error fetching courses:', errorInfo)
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch courses'))
      // Don't clear courses on error, keep existing data
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
          await fetchCourses()
        }

        // Set up real-time subscription
        channel = supabase
          .channel('courses-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'courses',
            },
            async (payload) => {
              if (mounted) {
                console.log('🔄 Courses realtime event:', payload.eventType)
                // Small delay to ensure database is updated
                await new Promise(resolve => setTimeout(resolve, 100))
                await fetchCourses()
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to courses realtime')
            } else if (status === 'CHANNEL_ERROR') {
              // Realtime is optional - don't break the app if it fails
              console.warn('⚠️ Courses realtime channel error - continuing without realtime updates')
              if (err) {
                console.warn('Realtime error details:', err)
              }
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn('⚠️ Courses realtime subscription status:', status, '- continuing without realtime updates')
            }
          })
      } catch (err) {
        console.error('Error setting up courses subscription:', err)
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
  }, [fetchCourses])

  return { courses, loading, error, refetch: fetchCourses }
}

