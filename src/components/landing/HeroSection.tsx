'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface RecentStudent {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
}

export function HeroSection() {
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [todayCount, setTodayCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentStudents = async () => {
      try {
        const supabase = createClient()
        
        // First try using RPC function (more reliable with PostgreSQL DATE function)
        console.log('Attempting to call RPC function...')
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_today_students_with_count', {
          limit_count: 3
        })

        if (rpcError) {
          console.error('RPC Error:', rpcError)
          console.log('Falling back to direct query...')
          // Fallback to direct query if RPC fails
          await fetchDirectQuery(supabase)
        } else {
          console.log('RPC Response received:', rpcData)
          console.log('RPC Response type:', typeof rpcData)
          
          // Handle the RPC response - it returns JSON, so we need to parse it if it's a string
          let parsedData = rpcData
          if (typeof rpcData === 'string') {
            try {
              parsedData = JSON.parse(rpcData)
            } catch (e) {
              console.error('Error parsing RPC response:', e)
              await fetchDirectQuery(supabase)
              return
            }
          }
          
          if (parsedData && typeof parsedData === 'object') {
            const count = parsedData.count ?? 0
            const students = Array.isArray(parsedData.students) ? parsedData.students : []
            
            console.log('Parsed count:', count)
            console.log('Parsed students:', students)
            
            setTodayCount(count)
            setRecentStudents(students)
            console.log('Students joined today (RPC):', count)
            console.log('Recent students (RPC):', students.length)
          } else {
            console.log('RPC returned unexpected format, falling back to direct query...')
            // If RPC returns null or unexpected format, try direct query
            await fetchDirectQuery(supabase)
          }
        }
      } catch (error) {
        console.error('Error fetching recent students:', error)
        // Fallback to direct query
        const supabase = createClient()
        await fetchDirectQuery(supabase)
      } finally {
        setIsLoading(false)
      }
    }

    // Fallback function using direct query
    const fetchDirectQuery = async (supabase: ReturnType<typeof createClient>) => {
      try {
        // Get today's date range
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        
        const todayStartISO = todayStart.toISOString()
        const todayEndISO = todayEnd.toISOString()
        
        console.log('Using direct query - Date range:', {
          start: todayStartISO,
          end: todayEndISO,
          localDate: now.toLocaleDateString()
        })
        
        // Fetch count
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .not('created_at', 'is', null)
          .gte('created_at', todayStartISO)
          .lte('created_at', todayEndISO)

        if (countError) {
          console.error('Error fetching count:', countError)
          setTodayCount(0)
        } else {
          console.log('Students joined today (direct query):', count || 0)
          setTodayCount(count || 0)
        }

        // Fetch students
        const { data: students, error: studentsError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email, created_at')
          .eq('role', 'student')
          .not('created_at', 'is', null)
          .gte('created_at', todayStartISO)
          .lte('created_at', todayEndISO)
          .order('created_at', { ascending: false })
          .limit(3)

        if (studentsError) {
          console.error('Error fetching students:', studentsError)
          setRecentStudents([])
        } else if (students) {
          console.log('Recent students found (direct query):', students.length)
          setRecentStudents(students)
        } else {
          setRecentStudents([])
        }
      } catch (error) {
        console.error('Error in direct query fallback:', error)
        setTodayCount(0)
        setRecentStudents([])
      }
    }

    fetchRecentStudents()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRecentStudents, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Get initials from name or email
  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  // Generate avatar colors based on index
  const getAvatarColor = (index: number) => {
    const colors = [
      { bg: 'bg-chart-1/20', text: 'text-chart-1' },
      { bg: 'bg-chart-2/20', text: 'text-chart-2' },
      { bg: 'bg-chart-3/20', text: 'text-chart-3' },
    ]
    return colors[index % colors.length]
  }
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background pt-12 md:pt-16">
      {/* Subtle background pattern - Responsive gradient spacing */}
      <div className="absolute inset-0 opacity-[0.015]">
        {/* Mobile: 20px spacing */}
        <div 
          className="absolute inset-0 sm:hidden" 
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 20px)`,
          }} 
        />
        {/* Tablet: 30px spacing */}
        <div 
          className="hidden sm:block md:hidden absolute inset-0" 
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 30px)`,
          }} 
        />
        {/* Desktop: 40px spacing */}
        <div 
          className="hidden md:block absolute inset-0" 
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)`,
          }} 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start lg:items-center">
            {/* Left Column - Text Content (40-50% width) */}
            <div className="text-center lg:text-left space-y-4 md:space-y-6">
              {/* Main Heading - Stacked, centered on mobile, left-aligned on desktop */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold text-foreground leading-[1.2] tracking-tight">
                <span className="block">Master</span>
                <span className="block">Aptitude Tests</span>
                <span className="block">with AI-Powered</span>
                <span className="block">Learning</span>
              </h1>

              {/* Paragraph Text - Centered on mobile, left-aligned on desktop */}
              <div className="space-y-3 sm:space-y-3 md:space-y-4 max-w-xl mx-auto lg:mx-0">
                <p className="text-sm sm:text-base md:text-lg text-foreground/70 leading-relaxed">
                  Join <span className="font-semibold text-foreground">50,000+ students</span> who are already mastering aptitude tests and landing their dream placements. 
                  <span className="block mt-2 text-foreground/80 font-medium">
                    Every day you wait, your competition gets stronger. Start practicing today or risk falling behind.
                  </span>
                </p>
                {/* Social proof badge */}
                <div className="flex items-center gap-2 text-sm sm:text-base md:text-base text-muted-foreground">
                  <div className="flex -space-x-2">
                    {isLoading ? (
                      // Loading state - show placeholder circles
                      <>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/20 border-2 border-background animate-pulse" />
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/30 border-2 border-background animate-pulse" />
                        <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/40 border-2 border-background animate-pulse" />
                      </>
                    ) : (
                      // Show actual student avatars or placeholders
                      Array.from({ length: 3 }).map((_, index) => {
                        const student = recentStudents[index]
                        const avatarColor = getAvatarColor(index)
                        
                        if (student) {
                          // Show actual student avatar
                          return (
                            <Avatar
                              key={student.id}
                              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-background"
                            >
                              {student.avatar_url ? (
                                <AvatarImage 
                                  src={student.avatar_url} 
                                  alt={student.full_name || student.email}
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className={`${avatarColor.bg} ${avatarColor.text} font-semibold text-xs sm:text-sm`}>
                                {getInitials(student.full_name, student.email)}
                              </AvatarFallback>
                            </Avatar>
                          )
                        } else {
                          // Show placeholder when no student
                          const opacity = ['20', '30', '40'][index]
                          return (
                            <div
                              key={`placeholder-${index}`}
                              className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary/${opacity} border-2 border-background`}
                            />
                          )
                        }
                      })
                    )}
                  </div>
                  <span className="font-medium text-foreground/70">
                    🔥 {isLoading ? '...' : todayCount || 0} {todayCount === 1 ? 'student' : 'students'} joined today
                  </span>
                </div>
              </div>

              {/* CTA Buttons - Centered on mobile, left-aligned on desktop */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start sm:items-center gap-3 sm:gap-4 pt-2">
                {/* Primary CTA - Black button with white text */}
                <Button
                  size="lg"
                  asChild
                  className="bg-foreground hover:bg-foreground/90 text-background shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-6 md:px-6 py-3 md:py-6 text-base md:text-base min-h-[44px] sm:min-h-[48px]"
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
                  className="border-2 border-foreground hover:bg-accent/50 transition-all duration-300 rounded-full px-6 md:px-6 py-3 md:py-6 text-base md:text-base bg-background min-h-[44px] sm:min-h-[48px]"
                >
                  <Link href="/practice">See Magic in Action</Link>
                </Button>
              </div>
            </div>

            {/* Right Column - UI Cards (50-60% width) */}
            <div className="relative mt-8 lg:mt-0 lg:pl-8">
              <div className="space-y-6 relative">
                {/* Top Card - "Top Performers" Card (Larger) */}
                <Card className="relative z-10 rounded-2xl border border-border shadow-lg bg-card/95 backdrop-blur-sm p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg md:text-lg font-semibold text-foreground">Top Performers</h3>
                    <button className="flex items-center gap-1 text-sm sm:text-base md:text-base text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-h-[44px] min-w-[44px] px-2 py-2">
                      <span className="text-sm sm:text-base md:text-base">This Week</span>
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Student 1 - Highlighted */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/40">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-chart-1/20 text-chart-1 font-semibold">RK</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base md:text-base font-medium text-foreground truncate">Rahul Kumar</div>
                        <div className="text-xs sm:text-sm md:text-sm text-muted-foreground truncate">95th percentile • Placed at TCS</div>
                      </div>
                      <div className="px-3 py-2 bg-chart-1/20 text-chart-1 rounded-md text-sm sm:text-base md:text-base font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center">
                        95%
                      </div>
                    </div>

                    {/* Student 2 */}
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-chart-2/20 text-chart-2 font-semibold">PS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base md:text-base font-medium text-foreground truncate">Priya Sharma</div>
                        <div className="text-xs sm:text-sm md:text-sm text-muted-foreground truncate">92nd percentile • Placed at Infosys</div>
                      </div>
                      <div className="px-3 py-2 bg-chart-2/20 text-chart-2 rounded-md text-sm sm:text-base md:text-base font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center">
                        92%
                      </div>
                    </div>

                    {/* Student 3 */}
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-chart-3/20 text-chart-3 font-semibold">AM</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base md:text-base font-medium text-foreground truncate">Amit Mehta</div>
                        <div className="text-xs sm:text-sm md:text-sm text-muted-foreground truncate">90th percentile • Placed at Wipro</div>
                      </div>
                      <div className="px-3 py-2 bg-chart-3/20 text-chart-3 rounded-md text-sm sm:text-base md:text-base font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center">
                        90%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Link 
                      href="/leaderboard" 
                      className="flex items-center gap-2 text-sm sm:text-base md:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 py-2"
                    >
                      View Leaderboard
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                    </Link>
                  </div>
                </Card>

                {/* Bottom Card - "Daily Practice" Card (Smaller, Overlapping) */}
                <Card className="relative z-0 -mt-4 sm:-mt-8 rounded-2xl border border-border shadow-lg bg-card/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 ml-0 sm:ml-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg md:text-lg font-semibold text-foreground">Daily Practice</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">2h 20m</div>
                      <div className="text-xs sm:text-sm md:text-base text-chart-1 font-medium">+30m this week</div>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-end gap-1 sm:gap-2 h-20 sm:h-24 md:h-28 mt-4 sm:mt-6">
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
                            <span className="text-xs sm:text-sm md:text-base text-muted-foreground">{day}</span>
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
