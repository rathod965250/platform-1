import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsPageContent } from '@/components/settings/SettingsPageContent'

export const metadata = {
  title: 'Settings | Aptitude Preparation Platform',
  description: 'Manage your account settings and preferences',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile with preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('dashboard_preferences')
    .eq('id', user.id)
    .single()

  return (
    <SettingsPageContent
      userId={user.id}
      currentPreferences={profile?.dashboard_preferences || null}
    />
  )
}

