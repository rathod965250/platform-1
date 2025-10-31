import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { User, Calendar, Mail, Phone, Building2 } from 'lucide-react'

export const metadata = {
  title: 'Profile | Aptitude Preparation Platform',
  description: 'Manage your profile and preferences',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Calculate some stats
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select('id, time_taken_seconds')
    .eq('user_id', user.id)

  const totalTimeSpent = testAttempts?.reduce((sum, attempt) => sum + attempt.time_taken_seconds, 0) || 0
  const totalHours = Math.floor(totalTimeSpent / 3600)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile?.full_name || 'Student'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{profile?.email}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">{profile?.role}</Badge>
                  {profile?.college && <Badge variant="outline">{profile.college}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Your activity summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Member Since</div>
                  <div className="font-semibold">
                    {new Date(profile?.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="h-8 w-8 bg-purple-600">⏱️</Badge>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time Practicing</div>
                  <div className="font-semibold">{totalHours} hours</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="h-8 w-8 bg-green-600">🏆</Badge>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                  <div className="font-semibold">Coming Soon</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

