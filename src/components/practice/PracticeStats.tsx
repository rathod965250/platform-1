'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, Target, TrendingUp, Clock } from 'lucide-react'

interface PracticeStatsProps {
  totalQuestions: number
  accuracy: number
  streak: number
  totalTimeSeconds: number
  isLoading?: boolean
}

export function PracticeStats({ totalQuestions, accuracy, streak, totalTimeSeconds, isLoading }: PracticeStatsProps) {
  // Format total time into minutes and seconds
  const totalMinutes = Math.floor(totalTimeSeconds / 60)
  const remainingSeconds = totalTimeSeconds % 60
  const timeFormatted = totalMinutes > 0 
    ? `${totalMinutes}m ${remainingSeconds}s`
    : `${totalTimeSeconds}s`

  const stats = [
    {
      label: 'Total Questions',
      value: totalQuestions.toLocaleString(),
      icon: Brain,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Current Accuracy',
      value: `${accuracy.toFixed(1)}%`,
      icon: Target,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Active Streak',
      value: `${streak} day${streak !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      label: 'Total Time Taken',
      value: timeFormatted,
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-2 border-border">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg" />
                <Skeleton className="h-4 sm:h-5 w-24 sm:w-28" />
                <Skeleton className="h-6 sm:h-8 md:h-10 w-16 sm:w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground mb-2 sm:mb-2.5 md:mb-3 font-sans truncate">
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-sans break-words">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl ${stat.bgColor} shrink-0`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

