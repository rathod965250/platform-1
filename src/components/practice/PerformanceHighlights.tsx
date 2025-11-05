'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Target, ArrowRight, Trophy, AlertCircle } from 'lucide-react'

interface CategoryPerformance {
  category_id: string
  category_name: string
  mastery_score: number
  accuracy: number
  total_questions: number
}

interface PerformanceHighlightsProps {
  strengths: CategoryPerformance[]
  weakAreas: CategoryPerformance[]
  isLoading?: boolean
}

export function PerformanceHighlights({
  strengths,
  weakAreas,
  isLoading,
}: PerformanceHighlightsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <Card className="bg-card border-2 border-border">
          <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500 flex-shrink-0" />
              <span className="truncate">Your Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                  <Skeleton className="h-2 sm:h-2.5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-500 flex-shrink-0" />
              <span className="truncate">Areas for Improvement</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                  <Skeleton className="h-2 sm:h-2.5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
      {/* Strengths */}
      <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
        <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Your Strengths</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
          {strengths.length === 0 ? (
            <div className="text-center py-6 sm:py-8 md:py-10">
              <Target className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-muted-foreground mx-auto mb-3 sm:mb-4 md:mb-5 opacity-50" />
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 font-sans">No strengths identified yet</p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                Keep practicing to see your strengths
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {strengths.slice(0, 3).map((strength) => (
                <Link
                  key={strength.category_id}
                  href={`/practice/configure/${strength.category_id}`}
                  className="block p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group min-h-[44px]"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5 gap-2 sm:gap-3 flex-wrap">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors font-sans break-words">
                      {strength.category_name}
                    </h4>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-2 border-green-500/20 text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      Strong
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-xs sm:text-sm md:text-base mb-1.5 sm:mb-2 font-sans">
                        <span className="text-muted-foreground font-medium">Mastery</span>
                        <span className="font-bold text-foreground">
                          {(strength.mastery_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={strength.mastery_score * 100} className="h-2 sm:h-2.5 md:h-3" />
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                      <span>
                        <span className="font-semibold text-foreground">{strength.accuracy.toFixed(0)}%</span> accuracy
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{strength.total_questions}</span> questions
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-2.5 mt-3 sm:mt-3.5 md:mt-4 text-xs sm:text-sm md:text-base text-muted-foreground group-hover:text-primary transition-colors font-sans">
                    <span>View details</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weak Areas */}
      <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
        <CardHeader className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 md:pb-5">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold text-foreground font-sans">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-500 flex-shrink-0" />
            <span className="truncate">Areas for Improvement</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
          {weakAreas.length === 0 ? (
            <div className="text-center py-6 sm:py-8 md:py-10">
              <Target className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-muted-foreground mx-auto mb-3 sm:mb-4 md:mb-5 opacity-50" />
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 font-sans">No weak areas identified</p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
                Great job! Keep up the good work
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {weakAreas.slice(0, 3).map((weakArea) => (
                <div
                  key={weakArea.category_id}
                  className="block p-3 sm:p-4 md:p-5 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5 gap-2 sm:gap-3 flex-wrap">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors font-sans break-words">
                      {weakArea.category_name}
                    </h4>
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-2 border-orange-500/20 text-xs sm:text-sm md:text-base font-medium px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 font-sans">
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      Needs Work
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-xs sm:text-sm md:text-base mb-1.5 sm:mb-2 font-sans">
                        <span className="text-muted-foreground font-medium">Mastery</span>
                        <span className="font-bold text-foreground">
                          {(weakArea.mastery_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={weakArea.mastery_score * 100} className="h-2 sm:h-2.5 md:h-3" />
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm md:text-base text-muted-foreground font-sans">
                      <span>
                        <span className="font-semibold text-foreground">{weakArea.accuracy.toFixed(0)}%</span> accuracy
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{weakArea.total_questions}</span> questions
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 sm:mt-3.5 md:mt-4 w-full group-hover:bg-primary/10 text-xs sm:text-sm md:text-base font-medium min-h-[44px] sm:min-h-[48px] hover:text-primary transition-all duration-200"
                    asChild
                  >
                    <Link href={`/practice/configure/${weakArea.category_id}`}>
                      Practice Now
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

