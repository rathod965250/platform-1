'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, LogOut, User, Calendar, HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { DashboardPreferences } from '@/components/settings/DashboardPreferences'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AccountModalsProps {
  openProfile: boolean
  openSettings: boolean
  openHelp: boolean
  onProfileClose: () => void
  onSettingsClose: () => void
  onHelpClose: () => void
}

export function AccountModals({
  openProfile,
  openSettings,
  openHelp,
  onProfileClose,
  onSettingsClose,
  onHelpClose,
}: AccountModalsProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [dashboardPreferences, setDashboardPreferences] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
        setDashboardPreferences(profileData?.dashboard_preferences || null)
      }
      setLoading(false)
    }

    if (openProfile || openSettings || openHelp) {
      fetchData()
    }
  }, [openProfile, openSettings, openHelp])

  // Calculate stats for profile
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)

  useEffect(() => {
    async function fetchStats() {
      if (!userId || !openProfile) return
      
      const supabase = createClient()
      const { data: testAttempts } = await supabase
        .from('test_attempts')
        .select('id, time_taken_seconds')
        .eq('user_id', userId)

      const time = testAttempts?.reduce((sum, attempt) => sum + (attempt.time_taken_seconds || 0), 0) || 0
      setTotalTimeSpent(time)
    }

    if (openProfile && userId) {
      fetchStats()
    }
  }, [openProfile, userId])

  const totalHours = Math.floor(totalTimeSpent / 3600)

  return (
    <>
      {/* Profile Modal */}
      <Dialog open={openProfile} onOpenChange={onProfileClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Profile Overview */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <AvatarUpload
                      currentAvatarUrl={profile?.avatar_url}
                      userId={profile?.id}
                      onUploadComplete={(avatarUrl) => {
                        // Refresh profile data
                        setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }))
                      }}
                    />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-foreground mb-1">
                        {profile?.full_name || 'Student'}
                      </h2>
                      <p className="text-muted-foreground mb-2">{profile?.email}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">{profile?.role || 'Student'}</Badge>
                        {profile?.college && <Badge variant="outline">{profile.college}</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Statistics</CardTitle>
                  <CardDescription>Your activity summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Member Since</div>
                        <div className="font-semibold text-foreground">
                          {profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="h-8 w-8 bg-primary flex items-center justify-center">⏱️</Badge>
                      <div>
                        <div className="text-sm text-muted-foreground">Time Practicing</div>
                        <div className="font-semibold text-foreground">{totalHours} hours</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onProfileClose()
                        router.push('/achievements')
                      }}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left w-full"
                    >
                      <Badge className="h-8 w-8 bg-primary flex items-center justify-center">🏆</Badge>
                      <div>
                        <div className="text-sm text-muted-foreground">Achievements</div>
                        <div className="font-semibold text-foreground">View All</div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile && <ProfileForm profile={profile} />}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={openSettings} onOpenChange={onSettingsClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and dashboard preferences
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : userId ? (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Dashboard Preferences</CardTitle>
                  <CardDescription>
                    Customize which motivational features you want to see on your dashboard.
                    You can toggle these features on or off based on your preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userId ? (
                    <DashboardPreferences
                      userId={userId}
                      currentPreferences={dashboardPreferences}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading preferences...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Logout Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account and session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      const supabase = createClient()
                      setIsLoggingOut(true)
                      try {
                        await supabase.auth.signOut()
                        toast.success('Logged out successfully')
                        window.location.href = '/'
                      } catch (error) {
                        console.error('Logout error:', error)
                        toast.error('Failed to logout')
                      } finally {
                        setIsLoggingOut(false)
                      }
                    }}
                    disabled={isLoggingOut}
                    className="w-full sm:w-auto"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Help & Support Modal */}
      <Dialog open={openHelp} onOpenChange={onHelpClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get help and answers to your questions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* FAQ Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How do I take a test?</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Test section and select from Mock Tests, Company Specific, or Custom Test options. Click on any test to view instructions and start.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How does adaptive practice work?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI adjusts the difficulty of questions based on your performance. Start with a category, and the system will adapt to your skill level.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How do I view my results?</h4>
                  <p className="text-sm text-muted-foreground">
                    After completing a test, you can view detailed results including score breakdown, category-wise performance, and solutions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Can I retake a test?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can retake any test multiple times. Each attempt is tracked separately in your results.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Email</div>
                    <div className="text-sm text-muted-foreground">hello@crackatom.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Phone</div>
                    <div className="text-sm text-muted-foreground">+91 (Available during business hours)</div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild className="w-full sm:w-auto">
                    <a href="mailto:hello@crackatom.com" target="_blank" rel="noopener noreferrer">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resources Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" asChild className="w-full justify-start">
                  <a href="/terms" target="_blank">Terms of Service</a>
                </Button>
                <Button variant="ghost" asChild className="w-full justify-start">
                  <a href="/privacy" target="_blank">Privacy Policy</a>
                </Button>
                <Button variant="ghost" asChild className="w-full justify-start">
                  <a href="/refund" target="_blank">Refund Policy</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

