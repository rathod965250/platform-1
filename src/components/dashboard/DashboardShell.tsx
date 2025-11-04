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
  User,
  Settings,
  LogOut,
  ClipboardList,
  FileText,
  Award,
  HelpCircle,
  Building2,
  Upload,
  ChevronRight,
  Clock,
  BookOpen,
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
import { AccountModals } from './AccountModals'
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [openProfileModal, setOpenProfileModal] = useState(false)
  const [openSettingsModal, setOpenSettingsModal] = useState(false)
  const [openHelpModal, setOpenHelpModal] = useState(false)

  // Auto-expand test menu when on test page
  React.useEffect(() => {
    if (pathname === '/test' || pathname === '/test/mock' || pathname === '/test/company-specific' || pathname === '/test/custom' || (pathname?.startsWith('/test/') && !pathname?.startsWith('/test/active/') && !pathname?.startsWith('/test/results/'))) {
      setIsTestMenuOpen(true)
    }
  }, [pathname])

  // Auto-expand account menu when modals are open
  React.useEffect(() => {
    if (openProfileModal || openSettingsModal || openHelpModal) {
      setIsAccountMenuOpen(true)
    }
  }, [openProfileModal, openSettingsModal, openHelpModal])


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
        <Sidebar collapsible="icon" className="border-r border-border">
          <SidebarContent className="gap-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard">
                      <Link href="/dashboard">
                        <BarChart3 className="size-5" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                    {weakAreas.length > 0 && (
                      <SidebarMenuBadge className="bg-primary/10 text-primary rounded-full">
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
                    <SidebarMenuButton asChild isActive={pathname === '/practice' || pathname?.startsWith('/practice/')} tooltip="Adaptive Practice">
                      <Link href="/practice">
                        <Brain className="size-5" />
                        <span>Adaptive Practice</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/assignments' || pathname?.startsWith('/assignments/')} tooltip="Assignments">
                      <Link href="/assignments">
                        <BookOpen className="size-5" />
                        <span>Assignments</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setIsTestMenuOpen(!isTestMenuOpen)}
                      isActive={pathname === '/test' || pathname?.startsWith('/test/')}
                      className="cursor-pointer"
                      tooltip="Test"
                    >
                      <ClipboardList className="size-5" />
                      <span>Test</span>
                      <ChevronRight 
                        className={`ml-auto size-4 transition-transform duration-200 ${isTestMenuOpen ? 'rotate-90' : ''}`} 
                      />
                    </SidebarMenuButton>
                    {isTestMenuOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/test/mock' || pathname?.startsWith('/test/mock/')}>
                            <Link href="/test/mock">
                              <FileText className="size-4" />
                              <span>Mock Tests</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/test/company-specific' || pathname?.startsWith('/test/company-specific/')}>
                            <Link href="/test/company-specific">
                              <Building2 className="size-4" />
                              <span>Company Specific</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/test/custom' || pathname?.startsWith('/test/custom/')}>
                            <Link href="/test/custom">
                              <Upload className="size-4" />
                              <span>Custom Test</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/results' || pathname?.startsWith('/results/')} tooltip="My Results">
                      <Link href="/results">
                        <FileText className="size-5" />
                        <span>My Results</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/analytics' || pathname?.startsWith('/analytics/')} tooltip="Analytics">
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
                    <SidebarMenuButton asChild isActive={pathname === '/leaderboard' || pathname?.startsWith('/leaderboard/')} tooltip="Leaderboard">
                      <Link href="/leaderboard">
                        <Trophy className="size-5" />
                        <span>Leaderboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/recent-activity' || pathname?.startsWith('/recent-activity/')} tooltip="Recent Activity">
                      <Link href="/recent-activity">
                        <Clock className="size-5" />
                        <span>Recent Activity</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/performance' || pathname?.startsWith('/performance/')} tooltip="Performance Tracking">
                      <Link href="/performance">
                        <Target className="size-5" />
                        <span>Performance Tracking</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/achievements' || pathname?.startsWith('/achievements/')} tooltip="Achievements">
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
                    <SidebarMenuButton 
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      isActive={openProfileModal || openSettingsModal || openHelpModal}
                      className="cursor-pointer"
                      tooltip="Account"
                    >
                      <User className="size-5" />
                      <span>Account</span>
                      <ChevronRight 
                        className={`ml-auto size-4 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-90' : ''}`} 
                      />
                    </SidebarMenuButton>
                    {isAccountMenuOpen && (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton 
                            onClick={() => setOpenProfileModal(true)}
                            isActive={openProfileModal}
                          >
                            <User className="size-4" />
                            <span>Profile</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton 
                            onClick={() => setOpenSettingsModal(true)}
                            isActive={openSettingsModal}
                          >
                            <Settings className="size-4" />
                            <span>Settings</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton 
                            onClick={() => setOpenHelpModal(true)}
                            isActive={openHelpModal}
                          >
                            <HelpCircle className="size-4" />
                            <span>Help & Support</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
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
              <div className="flex items-center gap-1.5">
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
      
      {/* Account Modals */}
      <AccountModals
        openProfile={openProfileModal}
        openSettings={openSettingsModal}
        openHelp={openHelpModal}
        onProfileClose={() => setOpenProfileModal(false)}
        onSettingsClose={() => setOpenSettingsModal(false)}
        onHelpClose={() => setOpenHelpModal(false)}
      />
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

