'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background pt-12 md:pt-16">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)`,
          }} 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start lg:items-center">
            {/* Left Column - Text Content (40-50% width) */}
            <div className="text-left space-y-4 md:space-y-6">
              {/* Main Heading - Stacked, left-aligned */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold text-foreground leading-[1.2] tracking-tight">
                <span className="block">Master</span>
                <span className="block">Aptitude Tests</span>
                <span className="block">with AI-Powered</span>
                <span className="block">Learning</span>
              </h1>

              {/* Paragraph Text - Left-aligned with urgency */}
              <div className="space-y-3 max-w-xl">
                <p className="text-sm md:text-base lg:text-lg text-foreground/70 leading-relaxed">
                  Join <span className="font-semibold text-foreground">50,000+ students</span> who are already mastering aptitude tests and landing their dream placements. 
                  <span className="block mt-2 text-foreground/80 font-medium">
                    Every day you wait, your competition gets stronger. Start practicing today or risk falling behind.
                  </span>
                </p>
                {/* Social proof badge */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background" />
                    <div className="w-6 h-6 rounded-full bg-primary/30 border-2 border-background" />
                    <div className="w-6 h-6 rounded-full bg-primary/40 border-2 border-background" />
                  </div>
                  <span className="font-medium text-foreground/70">🔥 127 students joined today</span>
                </div>
              </div>

              {/* CTA Buttons - Left-aligned */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2">
                {/* Primary CTA - Black button with white text */}
                <Button
                  size="lg"
                  asChild
                  className="bg-foreground hover:bg-foreground/90 text-background shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-5 md:px-6 py-5 md:py-6 text-sm md:text-base"
                >
                  <Link href="/signup">
                    Start Your Success Story
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                {/* Secondary CTA - White button with border */}
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-2 border-foreground hover:bg-accent/50 transition-all duration-300 rounded-full px-5 md:px-6 py-5 md:py-6 text-sm md:text-base bg-background"
                >
                  <Link href="/practice">See Magic in Action</Link>
                </Button>
              </div>
            </div>

            {/* Right Column - UI Cards (50-60% width) */}
            <div className="relative mt-8 lg:mt-0 lg:pl-8">
              <div className="space-y-6 relative">
                {/* Top Card - "Top Performers" Card (Larger) */}
                <Card className="relative z-10 rounded-2xl border border-border shadow-lg bg-card/95 backdrop-blur-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">Top Performers</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      This Week
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Student 1 - Highlighted */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/40">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-chart-1/20 text-chart-1 font-semibold">RK</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">Rahul Kumar</div>
                        <div className="text-xs text-muted-foreground truncate">95th percentile • Placed at TCS</div>
                      </div>
                      <div className="px-2 py-1 bg-chart-1/20 text-chart-1 rounded-md text-xs font-semibold">
                        95%
                      </div>
                    </div>

                    {/* Student 2 */}
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-chart-2/20 text-chart-2 font-semibold">PS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">Priya Sharma</div>
                        <div className="text-xs text-muted-foreground truncate">92nd percentile • Placed at Infosys</div>
                      </div>
                      <div className="px-2 py-1 bg-chart-2/20 text-chart-2 rounded-md text-xs font-semibold">
                        92%
                      </div>
                    </div>

                    {/* Student 3 */}
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-chart-3/20 text-chart-3 font-semibold">AM</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">Amit Mehta</div>
                        <div className="text-xs text-muted-foreground truncate">90th percentile • Placed at Wipro</div>
                      </div>
                      <div className="px-2 py-1 bg-chart-3/20 text-chart-3 rounded-md text-xs font-semibold">
                        90%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Link 
                      href="/leaderboard" 
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View Leaderboard
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Card>

                {/* Bottom Card - "Daily Practice" Card (Smaller, Overlapping) */}
                <Card className="relative z-0 -mt-4 sm:-mt-8 rounded-2xl border border-border shadow-lg bg-card/95 backdrop-blur-sm p-4 sm:p-6 ml-0 sm:ml-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-foreground">Daily Practice</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">2h 20m</div>
                      <div className="text-xs sm:text-sm text-chart-1 font-medium">+30m this week</div>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-end gap-1 sm:gap-2 h-20 sm:h-24 mt-4 sm:mt-6">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                        const heights = [60, 75, 55, 85, 70, 90, 65] // Percentage heights
                        const colors = [
                          'bg-chart-1',
                          'bg-chart-2', 
                          'bg-chart-3',
                          'bg-chart-1',
                          'bg-chart-2',
                          'bg-chart-3',
                          'bg-chart-1'
                        ]
                        return (
                          <div key={`day-${i}-${day}`} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className={`w-full rounded-t-sm ${colors[i]} opacity-70`}
                              style={{ height: `${heights[i]}%` }}
                            />
                            <span className="text-xs text-muted-foreground">{day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-accent-foreground/5 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
