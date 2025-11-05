'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const pricingPlans = [
  {
    name: 'Starter',
    subtitle: 'For early-stage teams',
    price: '$24',
    period: '/ mo',
    description: 'Designed for growing teams needing advanced features and scalability.',
    features: [
      'Access to core features',
      'Basic performance reporting',
      'Email support',
      'Strategy onboarding guide',
      'Monthly check-in summary',
    ],
    cta: 'Schedule a demo',
    popular: false,
  },
  {
    name: 'Growth',
    subtitle: 'Most popular',
    price: '$69',
    period: '/ mo',
    description: 'Designed for growing teams that need powerful tools and expert guidance.',
    features: [
      'Access to core features',
      'Advanced analytics dashboard',
      'Priority email support',
      'Quarterly strategy sessions',
      'Team access (up to 5 users)',
    ],
    cta: 'Schedule a demo',
    popular: true,
  },
  {
    name: 'Scale',
    subtitle: 'For fast-scaling startups',
    price: '$129',
    period: '/ mo',
    description: 'Built for fast-scaling startups that require deep insights and partnership.',
    features: [
      'Access to all features',
      'Dedicated success manager',
      'Custom KPI tracking',
      'Monthly performance reviews',
      'Team access (unlimited users)',
    ],
    cta: 'Schedule a demo',
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Flexible pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={cn(
                'relative border-2 transition-all duration-300 hover:shadow-xl',
                plan.popular
                  ? 'border-primary shadow-lg md:-translate-y-2 bg-card'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground mb-1">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  {plan.subtitle}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <Button
                  className={cn(
                    'w-full mb-6',
                    plan.popular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-foreground hover:bg-foreground/90 text-background'
                  )}
                  asChild
                >
                  <a href="/contact">{plan.cta}</a>
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base text-foreground/70">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

