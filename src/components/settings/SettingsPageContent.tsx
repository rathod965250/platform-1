'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'
import { DashboardPreferences } from './DashboardPreferences'

interface SettingsPageContentProps {
  userId: string
  currentPreferences: any
}

export function SettingsPageContent({
  userId,
  currentPreferences,
}: SettingsPageContentProps) {
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
            <DashboardPreferences
              userId={userId}
              currentPreferences={currentPreferences}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

