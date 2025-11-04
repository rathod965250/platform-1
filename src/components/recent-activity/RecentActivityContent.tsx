'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, ClipboardList, Clock } from 'lucide-react'

interface RecentActivityContentProps {
  recentActivity: Array<{
    type: 'test' | 'practice'
    id: string
    title: string
    date: string
    score: number
    totalMarks: number
    testId?: string
  }>
}

export function RecentActivityContent({ recentActivity }: RecentActivityContentProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      if (diffInHours < 1) return 'Just now'
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 break-words">
          Recent Activity
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View all your tests and practice sessions
        </p>
      </div>

      {/* Recent Activity Card */}
      <Card className="bg-card border-border">
        <CardHeader className="px-4 sm:px-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">All Activities</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your latest tests and practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="bg-primary/10 text-primary p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                      {activity.type === 'test' ? (
                        <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground text-sm sm:text-base mb-1 break-words">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatDate(activity.date)}</span>
                        {activity.type === 'test' && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground text-xs">
                            Test
                          </span>
                        )}
                        {activity.type === 'practice' && (
                          <span className="px-1.5 py-0.5 rounded bg-accent/50 text-accent-foreground text-xs">
                            Practice
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="text-left sm:text-right flex-1 sm:flex-none">
                      <div className="font-semibold text-foreground text-sm sm:text-base">
                        {activity.score}/{activity.totalMarks}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {activity.totalMarks > 0
                          ? `${((activity.score / activity.totalMarks) * 100).toFixed(0)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    {activity.type === 'test' && activity.testId && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => router.push(`/test/${activity.testId}/results/${activity.id}`)}
                      >
                        View Results
                      </Button>
                    )}
                    {activity.type === 'practice' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 border-secondary text-secondary-foreground hover:bg-secondary/10"
                        onClick={() => router.push('/practice')}
                      >
                        Practice More
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                No Activity Yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                Start practicing or take a test to see your activity here
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  size="sm"
                  className="sm:size-default bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => router.push('/practice')}
                >
                  Start Practice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="sm:size-default border-secondary text-secondary-foreground hover:bg-secondary/10"
                  onClick={() => router.push('/test')}
                >
                  Take a Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

