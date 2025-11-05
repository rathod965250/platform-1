'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { Menu } from 'lucide-react'
import { Settings, LogOut, User, Bell, FileText, Palette, Shield, Database, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { DashboardPreferences } from './DashboardPreferences'
import { ProfileSettings } from './ProfileSettings'
import { NotificationPreferences } from './NotificationPreferences'
import { TestPreferences } from './TestPreferences'
import { AppearanceSettings } from './AppearanceSettings'
import { PrivacySecurity } from './PrivacySecurity'
import { DataManagement } from './DataManagement'

type SettingsSection = 'profile' | 'dashboard' | 'notifications' | 'test' | 'appearance' | 'privacy' | 'data' | 'account'

const SETTINGS_SECTIONS: Array<{
  id: SettingsSection
  label: string
  icon: React.ElementType
}> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'test', label: 'Test', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'account', label: 'Account', icon: LogOut },
]

interface SettingsPageContentProps {
  userId: string
  currentPreferences: {
    dashboard_preferences: any
    notification_preferences: any
    test_preferences: any
    appearance_preferences: any
    privacy_preferences: any
  } | null
  currentProfile: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    college: string | null
    graduation_year: number | null
    target_companies: string[] | null
    avatar_url: string | null
  } | null
}

export function SettingsPageContent({
  userId,
  currentPreferences,
  currentProfile,
}: SettingsPageContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const isMobile = useIsMobile()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [validatedUserId, setValidatedUserId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Validate userId on mount and ensure it's available
  useEffect(() => {
    async function validateUser() {
      if (!userId) {
        console.error('SettingsPageContent: userId is missing')
        toast.error('User authentication error. Please refresh the page.')
        return
      }

      // Verify user is authenticated
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user || user.id !== userId) {
        console.error('SettingsPageContent: User validation failed', { error, userId, user })
        toast.error('User authentication error. Please log in again.')
        router.push('/login')
        return
      }

      setValidatedUserId(userId)
    }

    validateUser()
  }, [userId, supabase, router])

  // Initialize active section from URL hash or default to 'profile'
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    const validSection = SETTINGS_SECTIONS.find(s => s.id === hash)
    if (validSection) {
      setActiveSection(validSection.id)
    } else {
      setActiveSection('profile')
    }
  }, [])

  // Update URL hash when section changes
  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${pathname}#${section}`)
    }
    // Close mobile sidebar after selection
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
    // Scroll to top of content area
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!validatedUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm sm:text-base md:text-lg font-sans">Validating user session...</p>
        </div>
      </div>
    )
  }

  // Render active section content
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Profile Settings
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Manage your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <ProfileSettings
                userId={validatedUserId}
                currentProfile={currentProfile}
              />
            </CardContent>
          </Card>
        )
      case 'dashboard':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Dashboard Preferences
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Customize which motivational features you want to see on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <DashboardPreferences
                userId={validatedUserId}
                currentPreferences={currentPreferences?.dashboard_preferences || null}
              />
            </CardContent>
          </Card>
        )
      case 'notifications':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <NotificationPreferences
                userId={validatedUserId}
                currentPreferences={currentPreferences?.notification_preferences || null}
              />
            </CardContent>
          </Card>
        )
      case 'test':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Test/Exam Preferences
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Customize your test-taking experience and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <TestPreferences
                userId={validatedUserId}
                currentPreferences={currentPreferences?.test_preferences || null}
              />
            </CardContent>
          </Card>
        )
      case 'appearance':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Appearance Settings
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <AppearanceSettings
                userId={validatedUserId}
                currentPreferences={currentPreferences?.appearance_preferences || null}
              />
            </CardContent>
          </Card>
        )
      case 'privacy':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Manage your privacy settings and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <PrivacySecurity
                userId={validatedUserId}
                currentPreferences={currentPreferences?.privacy_preferences || null}
              />
            </CardContent>
          </Card>
        )
      case 'data':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Data Management
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Export your data or delete your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <DataManagement
                userId={validatedUserId}
              />
            </CardContent>
          </Card>
        )
      case 'account':
        return (
          <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md w-full max-w-full overflow-hidden flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <CardHeader className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground font-sans break-words leading-tight">
                Account Actions
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground font-sans leading-relaxed mt-1 sm:mt-1.5 md:mt-2 break-words">
                Manage your account and session
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-0">
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  // Render navigation items
  const renderNavigationItems = () => (
    <nav className="space-y-1">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon
        return (
          <button
            key={section.id}
            onClick={() => handleSectionChange(section.id)}
            className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm sm:text-base md:text-base font-medium min-h-[44px] sm:min-h-[48px] transition-all duration-200 text-left ${
              activeSection === section.id
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Icon className="size-5 sm:size-5 md:size-6 shrink-0" />
            <span className="font-sans flex-1 min-w-0">{section.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex flex-col lg:flex-row w-full">
      {/* Desktop Settings Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar shrink-0 -ml-4 -mr-6">
        <div className="p-3 sm:p-4">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-sidebar-foreground/80 dark:text-sidebar-foreground/70 px-3 sm:px-4 py-2 sm:py-2.5 font-sans">
              Settings
            </h2>
          </div>
          {renderNavigationItems()}
        </div>
      </aside>

      {/* Mobile/Tablet Settings Navigation */}
      <div className="lg:hidden w-full bg-sidebar sticky top-[56px] z-40 border-b-2 border-border -mx-4 sm:-mx-6">
        {/* Header with Menu Button */}
        <div className="p-2.5 sm:p-3 md:p-4 flex items-center justify-between border-b border-border">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] h-11 w-11"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Open settings menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <SheetHeader className="px-4 py-3 border-b border-border">
                <SheetTitle className="text-sm sm:text-base font-semibold text-sidebar-foreground">
                  Settings
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate between different settings sections
                </SheetDescription>
              </SheetHeader>
              <div className="p-3 sm:p-4">
                {renderNavigationItems()}
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 ml-2 sm:ml-3 min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-sidebar-foreground truncate">
              Settings
            </h2>
            <p className="text-[10px] sm:text-xs md:text-sm text-sidebar-foreground/70 truncate">
              {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.label || 'Profile'}
            </p>
          </div>
        </div>
        
        {/* Horizontal Scrollable Navigation Bar */}
        <div className="p-2 sm:p-2.5 md:p-3 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-1.5 sm:gap-2 md:gap-3 min-w-max">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-md text-[11px] sm:text-xs md:text-sm font-medium min-h-[44px] transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary shadow-sm border-2 border-primary/30'
                      : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary border-2 border-transparent'
                  }`}
                >
                  <Icon className="size-3.5 sm:size-4 md:size-5 shrink-0" />
                  <span className="font-sans">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={contentRef} className="flex-1 min-w-0 w-full lg:w-auto overflow-x-hidden">
        <div className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6 pt-2.5 sm:pt-3 md:pt-4 lg:pt-5 xl:pt-6 pb-2.5 sm:pb-3 md:pb-4 lg:pb-5 xl:pb-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  )
}
