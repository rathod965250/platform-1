'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  Brain,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  User,
  Settings,
  LogOut,
  Zap,
  ClipboardList,
  FileText,
  Award,
  HelpCircle,
  PanelLeftIcon,
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
import { Separator } from '@/components/ui/separator'
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
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { StudentSidebar } from './StudentSidebar'
import { SidebarProvider as CustomSidebarProvider, useSidebar } from '@/contexts/SidebarContext'
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
  const [sidebarMode, setSidebarMode] = useState<'detailed' | 'icon-only' | 'hidden'>('detailed')
  const { setSidebarVisible } = useSidebar()

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

  const cycleSidebar = () => {
    setSidebarMode(prev => {
      switch (prev) {
        case 'detailed':
          return 'icon-only'
        case 'icon-only':
          return 'detailed' // Switch back to detailed sidebar when in icon-only mode
        case 'hidden':
          return 'detailed'
        default:
          return 'detailed'
      }
    })
  }

  // Get appropriate button title based on current state
  const getSidebarButtonTitle = () => {
    switch (sidebarMode) {
      case 'detailed':
        return 'Switch to icon sidebar'
      case 'icon-only':
        return 'Show detailed sidebar'
      case 'hidden':
        return 'Show detailed sidebar'
      default:
        return 'Toggle sidebar'
    }
  }

  // Update sidebar visibility based on state
  React.useEffect(() => {
    switch (sidebarMode) {
      case 'icon-only':
        setSidebarVisible(true)
        break
      case 'hidden':
        setSidebarVisible(false)
        break
      default:
        setSidebarVisible(false) // Hide StudentSidebar when in detailed mode
        break
    }
  }, [sidebarMode, setSidebarVisible])

  return (
    <div className="flex min-h-dvh w-full">
      <SidebarProvider>
        {sidebarMode === 'icon-only' && (
          <StudentSidebar />
        )}
        {sidebarMode === 'detailed' && (
          <Sidebar collapsible="icon">
            <SidebarContent className="transition-all duration-300 ease-in-out">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                      <Link href="/dashboard">
                        <BarChart3 className="size-5" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                    {weakAreas.length > 0 && (
                      <SidebarMenuBadge className="bg-primary/10 rounded-full">
                        {weakAreas.length}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Practice</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/practice' || pathname?.startsWith('/practice/')}>
                      <Link href="/practice">
                        <Brain className="size-5" />
                        <span>Adaptive Practice</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/test' || pathname?.startsWith('/test/')}>
                      <Link href="/test">
                        <ClipboardList className="size-5" />
                        <span>Mock Tests</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/results' || pathname?.startsWith('/results/')}>
                      <Link href="/results">
                        <FileText className="size-5" />
                        <span>My Results</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/analytics' || pathname?.startsWith('/analytics/')}>
                      <Link href="/analytics">
                        <TrendingUp className="size-5" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Progress</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/leaderboard' || pathname?.startsWith('/leaderboard/')}>
                      <Link href="/leaderboard">
                        <Trophy className="size-5" />
                        <span>Leaderboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/performance' || pathname?.startsWith('/performance/')}>
                      <Link href="/performance">
                        <Target className="size-5" />
                        <span>Performance Tracking</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/achievements' || pathname?.startsWith('/achievements/')}>
                      <Link href="/achievements">
                        <Award className="size-5" />
                        <span>Achievements</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/profile">
                        <User className="size-5" />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/settings">
                        <Settings className="size-5" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/help">
                        <HelpCircle className="size-5" />
                        <span>Help & Support</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        )}

        <div className="flex flex-1 flex-col">
          <header className="bg-card sticky top-0 z-50 border-b border-border">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleSidebar}
                  className="size-7 [&_svg]:!size-5 transition-all duration-200"
                  title={getSidebarButtonTitle()}
                >
                  <PanelLeftIcon className="size-5" />
                </Button>
                <Separator orientation="vertical" className="hidden !h-4 sm:block" />
                <Breadcrumb className="hidden sm:block">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex items-center gap-1.5">
                <ProfileDropdown
                  profile={profile}
                  initials={getInitials(profile?.full_name)}
                  onSignOut={handleSignOut}
                  trigger={
                    <Button variant="ghost" size="icon" className="size-9.5">
                      <Avatar className="size-9.5 rounded-md">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
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
        </div>
      </SidebarProvider>
    </div>
  )
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <CustomSidebarProvider>
      <DashboardShellContent {...props} />
    </CustomSidebarProvider>
  )
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
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User'} />
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
            <Link href="/profile">
              <User className="mr-2 size-5 text-foreground" />
              My Account
            </Link>
          </DropdownMenuItem>
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

