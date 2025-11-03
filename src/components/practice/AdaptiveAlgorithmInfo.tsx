'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, Target, Zap, CheckCircle2, XCircle } from 'lucide-react'

export function AdaptiveAlgorithmInfo() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Difficulty',
      description: 'Questions automatically adjust based on your performance. Get harder questions as you improve!',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Mastery Tracking',
      description: 'Your mastery score (0-100%) tracks your progress in each category in real-time.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Target,
      title: 'Personalized Selection',
      description: 'Questions are selected specifically for you based on your strengths and weak areas.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Zap,
      title: 'Real-Time Feedback',
      description: 'Get instant feedback on every answer with detailed explanations to learn faster.',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
  ]

  const difficultyLevels = [
    {
      level: 'Easy',
      mastery: '< 35%',
      description: 'Perfect for learning basics and building confidence',
      color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      icon: CheckCircle2,
    },
    {
      level: 'Medium',
      mastery: '35% - 75%',
      description: 'Balanced difficulty to challenge and reinforce concepts',
      color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      icon: Target,
    },
    {
      level: 'Hard',
      mastery: '> 75%',
      description: 'Advanced questions for mastery and expert-level practice',
      color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      icon: TrendingUp,
    },
  ]

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Brain className="h-6 w-6 text-primary" />
          How Adaptive Practice Works
        </CardTitle>
        <CardDescription>
          Our AI-powered algorithm personalizes your practice experience to help you learn faster and more effectively
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Features */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      <Icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Difficulty Levels */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Difficulty Adjustment</h3>
          <div className="space-y-3">
            {difficultyLevels.map((level) => {
              const Icon = level.icon
              return (
                <div
                  key={level.level}
                  className="p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className={level.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {level.level}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">Mastery Score:</span>
                        <span className="text-sm text-muted-foreground">{level.mastery}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">How It Works</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">Start with Medium Difficulty</p>
                <p className="text-sm text-muted-foreground">
                  All users begin with medium difficulty questions to establish a baseline
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">Track Your Answers</p>
                <p className="text-sm text-muted-foreground">
                  Each correct answer increases your mastery score (+0.05), while incorrect answers decrease it (-0.05)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">Difficulty Adjusts Automatically</p>
                <p className="text-sm text-muted-foreground">
                  When your mastery exceeds 75%, you'll get hard questions. Below 35%, you'll get easy questions to build confidence
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">Continuous Improvement</p>
                <p className="text-sm text-muted-foreground">
                  The algorithm tracks your last 10 answers to provide real-time difficulty adjustments
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

