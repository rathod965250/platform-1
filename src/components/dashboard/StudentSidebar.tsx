'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSidebar } from '@/contexts/SidebarContext'
import {
  LayoutDashboard,
  Brain,
  ClipboardList,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Practice', href: '/practice', icon: Brain },
  { name: 'Take Test', href: '/test', icon: ClipboardList },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'My Results', href: '/results', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { sidebarVisible, setSidebarVisible, collapsed } = useSidebar()

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

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white dark:bg-gray-800"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop sidebar toggle button - only show when sidebar is hidden */}
      {!sidebarVisible && (
        <div className="hidden lg:block fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarVisible(true)}
            className="bg-white dark:bg-gray-800 shadow-lg"
            title="Show sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          sidebarVisible 
            ? (isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
            : '-translate-x-full',
          !sidebarVisible && 'opacity-0'
        )}
        style={{
          visibility: sidebarVisible ? 'visible' : 'hidden',
          transitionProperty: 'transform, opacity, visibility',
          transitionDelay: sidebarVisible ? '0ms' : '300ms'
        }}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand with hide button */}
          <div className={cn(
            "flex h-16 items-center border-b border-gray-200 dark:border-gray-800",
            collapsed ? "px-2 justify-between" : "px-4 justify-between"
          )}>
            <Link href="/" className={cn(
              "flex items-center",
              collapsed ? "" : "gap-2"
            )}>
              <Home className="h-6 w-6 text-blue-600" />
              {!collapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Aptitude Prep
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarVisible(false)}
              className="hidden lg:flex h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Hide sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 space-y-1 py-4",
            collapsed ? "px-2" : "px-3"
          )}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors relative group',
                    collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && item.name}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {item.name}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className={cn(
            "border-t border-gray-200 dark:border-gray-800",
            collapsed ? "p-2" : "p-4"
          )}>
            <Button
              variant="ghost"
              title={collapsed ? (isLoggingOut ? 'Logging out...' : 'Logout') : undefined}
              className={cn(
                "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 relative group",
                collapsed ? "w-full justify-center p-3" : "w-full justify-start"
              )}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && (isLoggingOut ? 'Logging out...' : 'Logout')}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </div>
              )}
            </Button>
          </div>
        </div>
        </aside>
    </>
  )
}

