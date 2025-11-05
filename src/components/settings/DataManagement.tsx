'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Download, Trash2, FileText, Database } from 'lucide-react'

interface DataManagementProps {
  userId: string
}

export function DataManagement({ userId }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleExportData = async () => {
    if (!userId) {
      toast.error('User ID is missing. Please refresh the page and try again.')
      return
    }

    setIsExporting(true)
    try {
      const supabase = createClient()
      
      // First verify user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser || authUser.id !== userId) {
        console.error('Authentication error:', { authError, authUser, userId })
        toast.error('Authentication failed. Please refresh the page and try again.')
        return
      }

      // Fetch all user data
      const [profile, testAttempts, practiceSessions, userAnalytics, userMetrics, adaptiveStates] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('test_attempts').select('*').eq('user_id', userId),
        supabase.from('practice_sessions').select('*').eq('user_id', userId),
        supabase.from('user_analytics').select('*').eq('user_id', userId),
        supabase.from('user_metrics').select('*').eq('user_id', userId).limit(1000),
        supabase.from('adaptive_state').select('*').eq('user_id', userId),
      ])

      // Combine all data
      const userData = {
        profile: profile.data,
        testAttempts: testAttempts.data,
        practiceSessions: practiceSessions.data,
        userAnalytics: userAnalytics.data,
        userMetrics: userMetrics.data,
        adaptiveStates: adaptiveStates.data,
        exportedAt: new Date().toISOString(),
      }

      // Create JSON blob
      const jsonBlob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(jsonBlob)

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `crackatom-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully!')
    } catch (error: any) {
      console.error('Error exporting data:', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(`Failed to export data: ${errorMessage}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!userId) {
      toast.error('User ID is missing. Please refresh the page and try again.')
      return
    }

    setIsDeleting(true)
    try {
      const supabase = createClient()
      
      // First verify user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser || authUser.id !== userId) {
        console.error('Authentication error:', { authError, authUser, userId })
        toast.error('Authentication failed. Please refresh the page and try again.')
        return
      }

      // Delete user account via API route
      // Note: This requires admin privileges
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error deleting account:', data.error)
        toast.error(data.error || 'Account deletion requires admin privileges. Please contact support.')
        return
      }

      toast.success('Account deleted successfully. Redirecting...')
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      console.error('Error deleting account (catch):', error)
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.'
      toast.error(`Failed to delete account: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Export Data Section */}
      <div className="p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 transition-all duration-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Download className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            Export Data
          </h3>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed mb-3 sm:mb-4">
          Download a copy of all your data including profile, test attempts, practice sessions, and analytics.
          Your data will be exported as a JSON file.
        </p>
        <Button
          onClick={handleExportData}
          disabled={isExporting}
          variant="outline"
          className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 border-2 border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Export My Data
            </>
          )}
        </Button>
      </div>

      {/* Data Retention Information */}
      <div className="p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border bg-muted/50">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-2.5">
          <Database className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
          <h4 className="text-sm sm:text-base md:text-lg font-semibold text-foreground font-sans">
            Data Retention
          </h4>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
          Your data is retained as long as your account is active. All test attempts, practice sessions, and analytics are stored securely.
          You can export your data at any time or delete your account to remove all data permanently.
        </p>
      </div>

      {/* Delete Account Section */}
      <div className="p-3 sm:p-4 md:p-5 rounded-lg border-2 border-destructive/30 bg-destructive/5 hover:border-destructive/50 transition-all duration-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-destructive flex-shrink-0" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            Delete Account
          </h3>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed mb-3 sm:mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
          Please ensure you have exported your data before proceeding.
        </p>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 md:px-8 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                This includes:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your profile and personal information</li>
                  <li>All test attempts and scores</li>
                  <li>All practice sessions and progress</li>
                  <li>All analytics and performance data</li>
                  <li>All preferences and settings</li>
                </ul>
                <p className="mt-3 font-semibold text-foreground">
                  Please ensure you have exported your data before proceeding.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
              <AlertDialogCancel
                disabled={isDeleting}
                className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] border-2 border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full sm:w-auto text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Yes, Delete My Account
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

