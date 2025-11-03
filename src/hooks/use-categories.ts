import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  order: number
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon, order')
        .order('order', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setCategories(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
      // Don't clear categories on error, keep existing data
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
          await fetchCategories()
        }

        // Set up real-time subscription
        channel = supabase
          .channel('categories-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'categories',
            },
            async (payload) => {
              if (mounted) {
                console.log('🔄 Categories realtime event:', payload.eventType)
                // Small delay to ensure database is updated
                await new Promise(resolve => setTimeout(resolve, 100))
                await fetchCategories()
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscribed to categories realtime')
            } else if (status === 'CHANNEL_ERROR') {
              // Realtime is optional - don't break the app if it fails
              console.warn('⚠️ Categories realtime channel error - continuing without realtime updates')
              if (err) {
                console.warn('Realtime error details:', err)
              }
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn('⚠️ Categories realtime subscription status:', status, '- continuing without realtime updates')
            }
          })
      } catch (err) {
        console.error('Error setting up categories subscription:', err)
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
  }, [fetchCategories])

  return { categories, loading, error, refetch: fetchCategories }
}

