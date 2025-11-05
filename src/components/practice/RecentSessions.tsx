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
      <Card className="bg-card border-2 border-border">
        <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
            <span className="truncate">Recent Practice Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
                <Skeleton className="h-4 sm:h-5 w-full" />
                <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300">
        <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
            <span className="truncate">Recent Practice Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
          <div className="text-center py-6 sm:py-8 md:py-10">
            <Brain className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-muted-foreground mx-auto mb-3 sm:mb-4 md:mb-5 opacity-50" />
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 font-sans">No practice sessions yet</p>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
              Start practicing to see your sessions here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
      <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
          <span className="truncate">Recent Practice Sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
        <div className="space-y-3 sm:space-y-4">
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
                className="block p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group min-h-[44px]"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-2.5 flex-wrap">
                      <h4 className="text-sm sm:text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors font-sans break-words">
                        {session.category_name}
                      </h4>
                      <Badge variant="secondary" className="text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans">
                        {session.total_questions} Q
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm md:text-base text-muted-foreground mb-2 sm:mb-2.5 font-sans">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                        <span>
                          {session.correct_answers}/{session.total_questions} correct
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold text-foreground">{accuracy.toFixed(0)}%</span>
                        <span>accuracy</span>
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground flex items-center gap-1.5 sm:gap-2 font-sans">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {timeAgo}
                    </p>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
        
        {sessions.length === 5 && (
          <Button
            variant="ghost"
            className="w-full mt-4 sm:mt-5 md:mt-6 text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] hover:bg-primary/10 hover:text-primary transition-all duration-200"
            asChild
          >
            <Link href="/results">
              View All Sessions
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

