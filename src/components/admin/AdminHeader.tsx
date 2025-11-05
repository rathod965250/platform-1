'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function AdminHeader() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') return

      // Fetch unread messages count
      const { count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')

      setUnreadCount(count || 0)

      // Fetch recent messages
      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id, name, email, message, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentMessages(messages || [])
    }

    fetchUnreadCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Admin Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <span>Contact Messages</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-red-600">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentMessages.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-sm text-gray-500">No messages yet</span>
              </DropdownMenuItem>
            ) : (
              <>
                {recentMessages.map((message) => (
                  <DropdownMenuItem
                    key={message.id}
                    className="flex flex-col items-start gap-1 p-3"
                    onClick={() => router.push(`/admin/contact-messages?message=${message.id}`)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {message.name}
                      </span>
                      {message.status === 'new' && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 line-clamp-1">
                      {message.message}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(message.created_at)}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push('/admin/contact-messages')}
                  className="text-center font-medium"
                >
                  View All Messages
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

