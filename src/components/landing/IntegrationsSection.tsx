'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, BarChart3, Building2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Brain,
    title: 'AI-Adaptive Learning',
    subtitle: 'Your Personal Tutor That Never Sleeps',
    description: 'Watch as our AI learns your strengths and weaknesses in real-time. Every question adapts to challenge you perfectly—too easy? It gets harder. Too difficult? It finds your sweet spot. This isn\'t practice; it\'s a learning system that evolves with you.',
    gradient: 'from-chart-2 via-chart-2/80 to-chart-4',
    iconBg: 'bg-chart-2/20',
    iconColor: 'text-chart-2',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    subtitle: 'Know Your Performance Like Never Before',
    description: 'Dive deep into analytics that reveal exactly where you stand. Track percentile growth, identify weak spots before they become problems, and get AI-powered recommendations tailored just for you. See your progress in ways that actually matter.',
    gradient: 'from-chart-1 via-chart-1/80 to-chart-1',
    iconBg: 'bg-chart-1/20',
    iconColor: 'text-chart-1',
  },
  {
    icon: Building2,
    title: 'Company-Specific Preparation',
    subtitle: 'Practice in the Format That Gets You Hired',
    description: 'We\'ve analyzed thousands of placement tests to create questions that mirror real exam patterns. While we can\'t share actual PYQs, we provide similar challenges in the exact format companies use—so when test day arrives, it feels familiar.',
    gradient: 'from-chart-3 via-chart-3/80 to-chart-3',
    iconBg: 'bg-chart-3/20',
    iconColor: 'text-chart-3',
  },
  {
    icon: Clock,
    title: 'Real Exam Simulation',
    subtitle: 'Feel the Pressure, Master the Pace',
    description: 'Every second counts. Our timed tests replicate actual placement exam conditions—same time limits, same question types, same pressure. Practice under real constraints so that when it matters most, you\'re calm, confident, and ready.',
    gradient: 'from-chart-4 via-chart-2/80 to-chart-4',
    iconBg: 'bg-chart-4/20',
    iconColor: 'text-chart-4',
  },
]

export function IntegrationsSection() {
  return (
    <section className="py-12 md:py-16 bg-accent/10" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why CrackAtom Works
          </h2>
          <p className="text-base md:text-lg text-foreground/70 max-w-3xl mx-auto">
            Four powerful features designed to give you the edge in placement exams
          </p>
        </div>

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
                  'active:scale-[0.98] h-full flex flex-col'
                )}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <CardHeader className="relative pb-3 p-4 md:p-5 flex-shrink-0">
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                      'group-hover:shadow-md',
                      feature.iconBg
                    )}>
                      <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 group-hover:scale-110', feature.iconColor)} />
                    </div>
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-2 leading-tight">
                    {feature.title}
                  </CardTitle>
                  <p className="text-sm sm:text-base font-semibold text-primary mb-3 leading-tight">
                    {feature.subtitle}
                  </p>
                </CardHeader>
                <CardContent className="relative p-4 md:p-5 pt-0 flex-grow flex flex-col">
                  <CardDescription className="text-xs sm:text-sm md:text-base text-foreground/70 leading-relaxed line-clamp-4 flex-grow">
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

