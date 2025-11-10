'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  Brain,
  Trophy,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  ClipboardList,
  FileText,
  Award,
  Building2,
  Upload,
  ChevronRight,
  Clock,
  BookOpen,
  MessageSquare,
  Bell,
  Shield,
  ArrowLeftRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface DashboardShellProps {
  profile: any
  stats: {
    totalTests: number
    avgScore: number
    totalQuestionsAnswered: number
    currentStreak: number
  }
  recentActivity: Array<{
    type: 'test' | 'practice'
    id: string
    title: string
    date: string
    score: number
    totalMarks: number
    testId?: string
  }>
  performanceTrend: Array<{
    index: number
    score: string
    date: string
  }>
  weakAreas: string[]
  masteryLevels?: Record<string, number>
  adaptiveStates?: any[]
  children: React.ReactNode
}

function DashboardShellContent({
  profile,
  stats,
  recentActivity,
  performanceTrend,
  weakAreas,
  masteryLevels = {},
  adaptiveStates = [],
  children,
}: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isTestMenuOpen, setIsTestMenuOpen] = useState(false)
  const [unreadRepliesCount, setUnreadRepliesCount] = useState(0)
  const [recentReplies, setRecentReplies] = useState<any[]>([])

  // Auto-expand test menu when on test page
  React.useEffect(() => {
    if (pathname === '/test' || pathname === '/test/mock' || pathname === '/test/company-specific' || pathname === '/test/custom' || (pathname?.startsWith('/test/') && !pathname?.startsWith('/test/active/') && !pathname?.startsWith('/test/results/'))) {
      setIsTestMenuOpen(true)
    }
  }, [pathname])

  // Fetch unread replies count
  React.useEffect(() => {
    const fetchUnreadReplies = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get user profile to get email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (!profile?.email) return

      // Fetch messages with replies
      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id, name, email, message, reply, replied_at, created_at, status')
        .or(`email.eq.${profile.email.toLowerCase()},user_id.eq.${user.id}`)
        .not('reply', 'is', null)
        .order('replied_at', { ascending: false })
        .limit(10)

      if (messages) {
        // Get viewed message IDs from localStorage
        const viewedMessages = JSON.parse(
          localStorage.getItem('viewed_replies') || '[]'
        ) as string[]

        // Filter out messages user has already viewed
        const unreadMessages = messages.filter(
          (msg) => !viewedMessages.includes(msg.id)
        )

        setUnreadRepliesCount(unreadMessages.length)
        setRecentReplies(messages.slice(0, 5))
      }
    }

    fetchUnreadReplies()

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadReplies, 30000)
    
    // Listen for message viewed events
    const handleMessageViewed = () => {
      fetchUnreadReplies()
    }
    window.addEventListener('messageViewed', handleMessageViewed)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('messageViewed', handleMessageViewed)
    }
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


  // Generate breadcrumb based on current pathname
  const breadcrumbItems = (() => {
    const items = [
      { label: 'Home', href: '/' }
    ]

    if (pathname === '/dashboard') {
      items.push({ label: 'Dashboard', href: null })
    } else if (pathname === '/practice' || pathname?.startsWith('/practice/')) {
      items.push({ label: 'Practice', href: '/practice' })
      if (pathname === '/practice/configure') {
        items.push({ label: 'Configure', href: null })
      } else if (pathname?.includes('/adaptive/')) {
        items.push({ label: 'Adaptive Practice', href: null })
      } else if (pathname?.includes('/summary')) {
        items.push({ label: 'Summary', href: null })
      }
    } else if (pathname === '/assignments' || pathname?.startsWith('/assignments/')) {
      items.push({ label: 'Assignments', href: '/assignments' })
    } else if (pathname === '/test' || pathname?.startsWith('/test/')) {
      items.push({ label: 'Test', href: '/test' })
      if (pathname === '/test/mock' || pathname?.startsWith('/test/mock/')) {
        items.push({ label: 'Mock Tests', href: '/test/mock' })
      } else if (pathname === '/test/company-specific' || pathname?.startsWith('/test/company-specific/')) {
        items.push({ label: 'Company Specific', href: '/test/company-specific' })
      } else if (pathname === '/test/custom' || pathname?.startsWith('/test/custom/')) {
        items.push({ label: 'Custom Test', href: '/test/custom' })
      } else if (pathname?.includes('/active/')) {
        items.push({ label: 'Active Test', href: null })
      } else if (pathname?.includes('/results/')) {
        items.push({ label: 'Results', href: null })
      }
    } else if (pathname === '/results' || pathname?.startsWith('/results/')) {
      items.push({ label: 'Results', href: '/results' })
    } else if (pathname === '/leaderboard' || pathname?.startsWith('/leaderboard/')) {
      items.push({ label: 'Leaderboard', href: '/leaderboard' })
    } else if (pathname === '/recent-activity' || pathname?.startsWith('/recent-activity/')) {
      items.push({ label: 'Recent Activity', href: '/recent-activity' })
    } else if (pathname === '/profile' || pathname?.startsWith('/profile/')) {
      items.push({ label: 'Profile', href: '/profile' })
    } else if (pathname === '/settings' || pathname?.startsWith('/settings/')) {
      items.push({ label: 'Settings', href: '/settings' })
    } else if (pathname === '/analytics' || pathname?.startsWith('/analytics/')) {
      items.push({ label: 'Analytics', href: '/analytics' })
    } else {
      // Default: try to extract page name from pathname
      const pathParts = pathname?.split('/').filter(Boolean) || []
      if (pathParts.length > 0) {
        const pageName = pathParts[pathParts.length - 1]
        const capitalized = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ')
        items.push({ label: capitalized, href: null })
      }
    }

    return items
  })()

  const getBreadcrumbItems = () => breadcrumbItems

  const handleSignOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      router.push('/login')
      router.refresh()
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full">
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
          <SidebarContent className="gap-3 sm:gap-4 p-3 sm:p-4">
            <SidebarGroup className="group-data-[collapsible=icon]:pl-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/dashboard">
                        <BarChart3 className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                    {weakAreas.length > 0 && pathname === '/dashboard' && (
                      <SidebarMenuBadge className="bg-primary/10 text-primary rounded-full group-data-[collapsible=icon]:hidden">
                        {weakAreas.length}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/messages' || pathname?.startsWith('/dashboard/messages/')} tooltip="My Messages" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/dashboard/messages">
                        <MessageSquare className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">My Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="group-data-[collapsible=icon]:pl-1">
              <SidebarGroupLabel className="text-xs sm:text-sm md:text-base font-semibold text-sidebar-foreground/80 dark:text-sidebar-foreground/70 px-3 sm:px-4 py-2 sm:py-2.5 font-sans group-data-[collapsible=icon]:hidden">Practice</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/practice' || pathname?.startsWith('/practice/')} tooltip="Adaptive Practice" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/practice">
                        <Brain className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Adaptive Practice</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/assignments' || pathname?.startsWith('/assignments/')} tooltip="Assignments" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/assignments">
                        <BookOpen className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Assignments</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      isActive={pathname === '/test' || pathname?.startsWith('/test/')}
                      className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5"
                      tooltip="Test"
                    >
                      <Link href="/test" onClick={(e) => {
                        e.preventDefault()
                        setIsTestMenuOpen(!isTestMenuOpen)
                        router.push('/test')
                      }}>
                        <ClipboardList className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Test</span>
                        <ChevronRight 
                          className={`ml-auto size-4 sm:size-4 md:size-5 transition-transform duration-200 shrink-0 group-data-[collapsible=icon]:hidden ${isTestMenuOpen ? 'rotate-90' : ''}`} 
                        />
                      </Link>
                    </SidebarMenuButton>
                    {isTestMenuOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/test/mock' || pathname?.startsWith('/test/mock/')} className="text-xs sm:text-sm md:text-base font-medium min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-sans [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5 group-data-[collapsible=icon]:justify-center">
                            <Link href="/test/mock">
                              <FileText className="size-4 sm:size-4 md:size-5 shrink-0 group-data-[collapsible=icon]:size-4" />
                              <span className="flex-1 min-w-0">Mock Tests</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/test/company-specific' || pathname?.startsWith('/test/company-specific/')} className="text-xs sm:text-sm md:text-base font-medium min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-sans [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5 group-data-[collapsible=icon]:justify-center">
                            <Link href="/test/company-specific">
                              <Building2 className="size-4 sm:size-4 md:size-5 shrink-0 group-data-[collapsible=icon]:size-4" />
                              <span className="flex-1 min-w-0">Company Specific</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/test/custom' || pathname?.startsWith('/test/custom/')} className="text-xs sm:text-sm md:text-base font-medium min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary font-sans [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5 group-data-[collapsible=icon]:justify-center">
                            <Link href="/test/custom">
                              <Upload className="size-4 sm:size-4 md:size-5 shrink-0 group-data-[collapsible=icon]:size-4" />
                              <span className="flex-1 min-w-0">Custom Test</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/results' || pathname?.startsWith('/results/')} tooltip="My Results" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/results">
                        <FileText className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">My Results</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/analytics' || pathname?.startsWith('/analytics/')} tooltip="Analytics" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/analytics">
                        <TrendingUp className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="group-data-[collapsible=icon]:pl-1">
              <SidebarGroupLabel className="text-xs sm:text-sm md:text-base font-semibold text-sidebar-foreground/80 dark:text-sidebar-foreground/70 px-3 sm:px-4 py-2 sm:py-2.5 font-sans group-data-[collapsible=icon]:hidden">Progress</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/leaderboard' || pathname?.startsWith('/leaderboard/')} tooltip="Leaderboard" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/leaderboard">
                        <Trophy className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Leaderboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/recent-activity' || pathname?.startsWith('/recent-activity/')} tooltip="Recent Activity" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/recent-activity">
                        <Clock className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Recent Activity</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/performance' || pathname?.startsWith('/performance/')} tooltip="Performance Tracking" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/performance">
                        <Target className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Performance Tracking</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/achievements' || pathname?.startsWith('/achievements/')} tooltip="Achievements" className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5">
                      <Link href="/achievements">
                        <Award className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Achievements</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="group-data-[collapsible=icon]:pl-1">
              <SidebarGroupLabel className="text-xs sm:text-sm md:text-base font-semibold text-sidebar-foreground/80 dark:text-sidebar-foreground/70 px-3 sm:px-4 py-2 sm:py-2.5 font-sans group-data-[collapsible=icon]:hidden">Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      isActive={pathname === '/settings' || pathname?.startsWith('/settings/')}
                      tooltip="Settings"
                      className="text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-primary/10 hover:text-primary transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm [&>span:last-child]:!truncate-none [&>span]:whitespace-normal group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-1.5 group-data-[collapsible=icon]:pr-1.5"
                    >
                      <Link href="/settings">
                        <Settings className="size-5 sm:size-5 md:size-6 shrink-0 group-data-[collapsible=icon]:size-5" />
                        <span className="font-sans flex-1 min-w-0">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="bg-card sticky top-0 z-50 border-b border-border">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="size-7 [&_svg]:!size-5" />
                <Breadcrumb className="hidden sm:block">
                  <BreadcrumbList>
                    {breadcrumbItems.map((item, index) => {
                      const isLast = index === breadcrumbItems.length - 1
                      return (
                        <React.Fragment key={index}>
                          <BreadcrumbItem>
                            {isLast || !item.href ? (
                              <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                      )
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Admin Dashboard Switch - Only for admins */}
                {profile?.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin Panel</span>
                  </Button>
                )}

                {/* Notifications Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative size-9.5">
                      <Bell className="h-5 w-5" />
                      {unreadRepliesCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {unreadRepliesCount > 9 ? '9+' : unreadRepliesCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>
                      <div className="flex items-center justify-between">
                        <span>Notifications</span>
                        {unreadRepliesCount > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {unreadRepliesCount} new
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {recentReplies.length === 0 ? (
                      <>
                        <DropdownMenuItem disabled>
                          <span className="text-sm text-muted-foreground">No replies yet</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push('/dashboard/messages')}
                          className="text-center font-medium cursor-pointer"
                        >
                          View All Messages
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {recentReplies.map((message) => (
                          <DropdownMenuItem
                            key={message.id}
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                            onClick={() => router.push(`/dashboard/messages?message=${message.id}`)}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-medium text-foreground">
                                Reply from Admin
                              </span>
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {message.message.substring(0, 50)}...
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.replied_at ? formatDate(message.replied_at) : 'Recently'}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push('/dashboard/messages')}
                          className="text-center font-medium cursor-pointer"
                        >
                          View All Messages
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <ProfileDropdown
                  profile={profile}
                  initials={getInitials(profile?.full_name)}
                  onSignOut={handleSignOut}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-9.5">
                      <Avatar className="size-9.5 rounded-md">
                        <AvatarImage 
                          src={profile?.avatar_url || undefined} 
                          alt={profile?.full_name || 'User'} 
                        />
                        <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
              </div>
            </div>
          </header>

          <main className="mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>

          <footer>
            <div className="text-muted-foreground mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6">
              <p className="text-sm text-balance max-sm:text-center">
                {`©${new Date().getFullYear()}`}{' '}
                <Link href="/" className="text-primary hover:underline">
                  CrackAtom
                </Link>
                , Master aptitude tests with AI-powered learning
              </p>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export function DashboardShell(props: DashboardShellProps) {
  return <DashboardShellContent {...props} />
}

function ProfileDropdown({
  profile,
  initials,
  onSignOut,
  trigger,
}: {
  profile: any
  initials: string
  onSignOut: () => void
  trigger: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center gap-4 px-4 py-2.5 font-normal">
          <div className="relative">
            <Avatar className="size-10">
              <AvatarImage 
                src={profile?.avatar_url || undefined} 
                alt={profile?.full_name || 'User'} 
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="ring-card absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2" />
          </div>
          <div className="flex flex-1 flex-col items-start">
            <span className="text-lg font-semibold text-foreground">{profile?.full_name || 'User'}</span>
            <span className="text-base text-muted-foreground">{profile?.email || ''}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="px-4 py-2.5 text-base" asChild>
            <Link href="/settings">
              <Settings className="mr-2 size-5 text-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="px-4 py-2.5 text-base text-destructive"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 size-5" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

