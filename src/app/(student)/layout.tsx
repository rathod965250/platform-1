import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentSidebar } from '@/components/dashboard/StudentSidebar'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Redirect admins to admin panel
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentSidebar />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  )
}

