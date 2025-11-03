'use client'

import { StudentSidebar } from './StudentSidebar'
import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'

export function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarVisible } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentSidebar />
      <main 
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarVisible ? "lg:ml-16" : "lg:ml-0"
        )}
      >
        {children}
      </main>
    </div>
  )
}