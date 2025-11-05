// Alternative version using RPC function for more reliable date filtering
// This version uses PostgreSQL's DATE() function which handles timezones automatically
// To use this, first run the SQL in supabase/rpc_get_today_students.sql to create the RPC function

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface RecentStudent {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
}

// Alternative implementation using RPC function
export function HeroSectionWithRPC() {
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [todayCount, setTodayCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentStudents = async () => {
      try {
        const supabase = createClient()
        
        // Option 1: Use RPC function that combines count and students
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_today_students_with_count', {
          limit_count: 3
        })

        if (rpcError) {
          console.error('Error fetching via RPC:', rpcError)
          // Fallback to direct query
          await fetchDirectQuery(supabase)
        } else if (rpcData) {
          setTodayCount(rpcData.count || 0)
          setRecentStudents(rpcData.students || [])
        }
      } catch (error) {
        console.error('Error fetching recent students:', error)
        setTodayCount(0)
        setRecentStudents([])
      } finally {
        setIsLoading(false)
      }
    }

    // Fallback function using direct query
    const fetchDirectQuery = async (supabase: ReturnType<typeof createClient>) => {
      // Get today's date range
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      
      const todayStartISO = todayStart.toISOString()
      const todayEndISO = todayEnd.toISOString()
      
      // Fetch count
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .not('created_at', 'is', null)
        .gte('created_at', todayStartISO)
        .lte('created_at', todayEndISO)

      if (!countError) {
        setTodayCount(count || 0)
      }

      // Fetch students
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, created_at')
        .eq('role', 'student')
        .not('created_at', 'is', null)
        .gte('created_at', todayStartISO)
        .lte('created_at', todayEndISO)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!studentsError && students) {
        setRecentStudents(students)
      }
    }

    fetchRecentStudents()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRecentStudents, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // ... rest of the component remains the same
  // (getInitials, getAvatarColor, and JSX remain identical to original)
}

