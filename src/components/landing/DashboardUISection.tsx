'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, Users, BarChart3 } from 'lucide-react'

export function DashboardUISection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Dashboard UI
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="rounded-2xl border border-border shadow-xl bg-card/95 backdrop-blur-sm p-6 md:p-8">
            {/* Mock Dashboard Preview */}
            <div className="space-y-6">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Performance Dashboard</div>
                    <div className="text-xs text-muted-foreground">Real-time analytics</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Users, label: 'Active Students', value: '12.5K', change: '+8.2%' },
                  { icon: TrendingUp, label: 'Avg Score', value: '87%', change: '+5.1%' },
                  { icon: BarChart3, label: 'Tests Taken', value: '2.3K', change: '+12%' },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div key={i} className="p-4 rounded-lg bg-accent/20 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-xs text-success">{stat.change}</div>
                    </div>
                  )
                })}
              </div>

              {/* Chart Placeholder */}
              <div className="h-64 rounded-lg bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border/50 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Performance Chart</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

