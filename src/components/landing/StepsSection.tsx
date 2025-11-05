'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Clock, Upload, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Target,
    title: 'Smart Practice Mode',
    description: 'AI-powered adaptive learning that adjusts difficulty based on your performance',
    gradient: 'from-chart-2 via-chart-2/80 to-chart-4',
    iconBg: 'bg-chart-2/20',
    iconColor: 'text-chart-2',
  },
  {
    icon: Clock,
    title: 'Real Exam Simulation',
    description: 'Experience actual test conditions with company-specific PYQs and time pressure',
    gradient: 'from-chart-4 via-chart-2/80 to-chart-4',
    iconBg: 'bg-chart-4/20',
    iconColor: 'text-chart-4',
  },
  {
    icon: Upload,
    title: 'Upload & Practice',
    description: 'Convert any PDF or document into an interactive test with AI question extraction',
    gradient: 'from-chart-3 via-chart-3/80 to-chart-3',
    iconBg: 'bg-chart-3/20',
    iconColor: 'text-chart-3',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Get AI-driven insights on strengths, weaknesses, and personalized improvement plans',
    gradient: 'from-chart-1 via-chart-1/80 to-chart-1',
    iconBg: 'bg-chart-1/20',
    iconColor: 'text-chart-1',
  },
]

export function StepsSection() {
  return (
    <section className="pt-0 pb-16 md:pb-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className={cn(
                  'group relative overflow-hidden border-2 border-border',
                  'cursor-pointer hover:border-primary/50 transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-1 bg-card',
                  'active:scale-[0.98]'
                )}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
                      'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                      'group-hover:shadow-md',
                      feature.iconBg
                    )}>
                      <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 group-hover:scale-110', feature.iconColor)} />
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex-1">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-sm sm:text-base md:text-lg text-foreground/70 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

