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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Strengths */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strengths.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No strengths identified yet</p>
              <p className="text-sm text-muted-foreground">
                Keep practicing to see your strengths
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {strengths.slice(0, 3).map((strength) => (
                <Link
                  key={strength.category_id}
                  href={`/practice/configure/${strength.category_id}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {strength.category_name}
                    </h4>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Strong
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className="font-semibold text-foreground">
                          {(strength.mastery_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={strength.mastery_score * 100} className="h-2" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">{strength.accuracy.toFixed(0)}%</span> accuracy
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{strength.total_questions}</span> questions
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span>View details</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weak Areas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weakAreas.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No weak areas identified</p>
              <p className="text-sm text-muted-foreground">
                Great job! Keep up the good work
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {weakAreas.slice(0, 3).map((weakArea) => (
                <div
                  key={weakArea.category_id}
                  className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {weakArea.category_name}
                    </h4>
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Needs Work
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className="font-semibold text-foreground">
                          {(weakArea.mastery_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={weakArea.mastery_score * 100} className="h-2" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">{weakArea.accuracy.toFixed(0)}%</span> accuracy
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{weakArea.total_questions}</span> questions
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full group-hover:bg-primary/10"
                    asChild
                  >
                    <Link href={`/practice/configure/${weakArea.category_id}`}>
                      Practice Now
                      <ArrowRight className="ml-2 h-4 w-4" />
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

