'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { DashboardPreferences } from './DashboardPreferences'

interface SettingsPageContentProps {
  userId: string
  currentPreferences: any
}

export function SettingsPageContent({
  userId,
  currentPreferences,
}: SettingsPageContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [validatedUserId, setValidatedUserId] = useState<string | null>(null)

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Settings
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account settings and dashboard preferences
          </p>
        </div>

        {/* Dashboard Preferences Section */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle>Dashboard Preferences</CardTitle>
            <CardDescription>
              Customize which motivational features you want to see on your dashboard.
              You can toggle these features on or off based on your preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validatedUserId ? (
              <DashboardPreferences
                userId={validatedUserId}
                currentPreferences={currentPreferences}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Validating user session...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account and session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

