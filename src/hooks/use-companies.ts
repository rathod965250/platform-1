import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Company {
  id: string
  name: string
  category?: string
  logo_url?: string
  is_active: boolean
  display_order: number
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCompanies = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError, status, statusText } = await supabase
        .from('companies')
        .select('id, name, category, logo_url, is_active, display_order')
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
        if (errorInfo.message) console.error('❌ Error fetching companies - Message:', errorInfo.message)
        if (errorInfo.code) console.error('❌ Error fetching companies - Code:', errorInfo.code)
        if (errorInfo.details) console.error('❌ Error fetching companies - Details:', errorInfo.details)
        if (errorInfo.hint) console.error('❌ Error fetching companies - Hint:', errorInfo.hint)
        if (status || statusText) {
          console.error('❌ Error fetching companies - Response status:', status, statusText)
        }
        if (Object.keys(errorInfo).length > 1) {
          console.error('❌ Error fetching companies - Full Error Info:', JSON.stringify(errorInfo, null, 2))
        } else {
          console.error('❌ Error fetching companies:', errorInfo)
        }
        
        // Check for specific error types
        const errorCode = fetchError && typeof fetchError === 'object' && 'code' in fetchError ? fetchError.code : null
        const errorMessage = fetchError && typeof fetchError === 'object' && 'message' in fetchError ? fetchError.message : null
        
        if (errorCode === '42P01') {
          console.error('❌ Table "companies" does not exist. Run the migration first.')
        } else if (errorCode === '42501') {
          console.error('❌ Permission denied. Check RLS policies for the companies table.')
        } else if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('JWT')) {
          console.error('❌ Authentication error. Check Supabase anon key.')
        }

        // Create proper error object for state
        const errorObj = fetchError instanceof Error 
          ? fetchError 
          : new Error(errorMessage || `Failed to fetch companies${status ? ` (Status: ${status})` : ''}`)
        
        setError(errorObj)
        // Don't clear companies on error, keep existing data
        return
      }

      setCompanies(data || [])
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
      if (errorInfo.message) console.error('❌ Unexpected error fetching companies - Message:', errorInfo.message)
      if (errorInfo.stack) console.error('❌ Unexpected error fetching companies - Stack:', errorInfo.stack)
      if (Object.keys(errorInfo).length > 1) {
        console.error('❌ Unexpected error fetching companies - Full Error Info:', JSON.stringify(errorInfo, null, 2))
      } else {
        console.error('❌ Unexpected error fetching companies:', errorInfo)
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch companies'))
      // Don't clear companies on error, keep existing data
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
          await fetchCompanies()
        }

        // Set up real-time subscription
        channel = supabase
          .channel('companies-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'companies',
            },
            async (payload) => {
              if (mounted) {
                console.log('🔄 Companies realtime event:', payload.eventType)
                // Small delay to ensure database is updated
                await new Promise(resolve => setTimeout(resolve, 100))
                await fetchCompanies()
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to companies realtime')
            } else if (status === 'CHANNEL_ERROR') {
              // Realtime is optional - don't break the app if it fails
              console.warn('⚠️ Companies realtime channel error - continuing without realtime updates')
              if (err) {
                console.warn('Realtime error details:', err)
              }
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn('⚠️ Companies realtime subscription status:', status, '- continuing without realtime updates')
            }
          })
      } catch (err) {
        console.error('Error setting up companies subscription:', err)
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
  }, [fetchCompanies])

  return { companies, loading, error, refetch: fetchCompanies }
}

