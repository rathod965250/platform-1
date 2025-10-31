'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Target, CheckCircle, TrendingUp, Clock, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Smart Practice',
    description: 'AI adapts to your skill level, providing personalized questions that challenge and improve your abilities',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Target,
    title: 'Test Simulation',
    description: 'Similar questions to simulate real tests. Practice with question types matching placement test patterns',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: CheckCircle,
    title: 'Instant Feedback',
    description: 'Learn from mistakes immediately with detailed explanations and step-by-step solutions for every question',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Visual analytics dashboard showing your growth, strengths, weaknesses, and performance trends over time',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Clock,
    title: 'Timed Tests',
    description: 'Simulate real exam conditions with full-length mock tests including timer, navigation, and auto-submit',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: BarChart3,
    title: 'Performance Insights',
    description: 'AI-powered recommendations based on your performance, helping you focus on areas that need improvement',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Key Features
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Everything you need to excel in aptitude tests, powered by AI and designed for your success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card"
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-foreground/70 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/5 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

