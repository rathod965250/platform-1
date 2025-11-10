import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeviceAnalyticsDashboard } from '@/components/admin/DeviceAnalyticsDashboard'

export const metadata = {
  title: 'Device Analytics | Admin Dashboard',
  description: 'View device and browser usage statistics',
}

export default async function DeviceAnalyticsPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <DeviceAnalyticsDashboard />
    </div>
  )
}
