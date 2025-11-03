'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Target, ArrowRight, Brain } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentSession {
  id: string
  category_id?: string
  category_name: string
  total_questions: number
  correct_answers: number
  completed_at: string
  created_at: string
}

interface RecentSessionsProps {
  sessions: RecentSession[]
  isLoading?: boolean
}

export function RecentSessions({ sessions, isLoading }: RecentSessionsProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Practice Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Practice Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No practice sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Start practicing to see your sessions here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Practice Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.slice(0, 5).map((session) => {
            const accuracy = session.total_questions > 0
              ? (session.correct_answers / session.total_questions) * 100
              : 0

            const completedDate = session.completed_at || session.created_at
            const timeAgo = completedDate
              ? formatDistanceToNow(new Date(completedDate), { addSuffix: true })
              : 'Recently'

            return (
              <Link
                key={session.id}
                href={session.category_id 
                  ? `/practice/adaptive/${session.category_id}/${session.id}/summary`
                  : `/practice`
                }
                className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {session.category_name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {session.total_questions} Q
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>
                          {session.correct_answers}/{session.total_questions} correct
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{accuracy.toFixed(0)}%</span>
                        <span>accuracy</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo}
                    </p>
                  </div>
                  
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
        
        {sessions.length === 5 && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            asChild
          >
            <Link href="/results">
              View All Sessions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

