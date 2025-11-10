'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Chrome,
  RefreshCw,
  TrendingUp,
  Users,
  Globe,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface DeviceStats {
  device_type: string
  browser_name: string
  count: number
  avg_screen_width: number
  avg_screen_height: number
}

interface DeviceSummary {
  totalTests: number
  desktopCount: number
  mobileCount: number
  tabletCount: number
  topBrowser: string
  topDevice: string
}

export function DeviceAnalyticsDashboard() {
  const [stats, setStats] = useState<DeviceStats[]>([])
  const [summary, setSummary] = useState<DeviceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const supabase = createClient()

  const fetchDeviceStats = async () => {
    setIsLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case 'all':
          startDate = new Date('2000-01-01')
          break
      }

      // Fetch device statistics
      const { data, error } = await supabase.rpc('get_device_statistics', {
        start_date: startDate.toISOString(),
        end_date: now.toISOString(),
      })

      if (error) throw error

      setStats(data || [])

      // Calculate summary
      if (data && data.length > 0) {
        const totalTests = data.reduce((sum: number, item: DeviceStats) => sum + item.count, 0)
        const desktopCount = data
          .filter((item: DeviceStats) => item.device_type === 'desktop')
          .reduce((sum: number, item: DeviceStats) => sum + item.count, 0)
        const mobileCount = data
          .filter((item: DeviceStats) => item.device_type === 'mobile')
          .reduce((sum: number, item: DeviceStats) => sum + item.count, 0)
        const tabletCount = data
          .filter((item: DeviceStats) => item.device_type === 'tablet')
          .reduce((sum: number, item: DeviceStats) => sum + item.count, 0)

        // Find top browser and device
        const browserCounts: Record<string, number> = {}
        const deviceCounts: Record<string, number> = {}

        data.forEach((item: DeviceStats) => {
          browserCounts[item.browser_name] = (browserCounts[item.browser_name] || 0) + item.count
          deviceCounts[item.device_type] = (deviceCounts[item.device_type] || 0) + item.count
        })

        const topBrowser = Object.entries(browserCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
        const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'

        setSummary({
          totalTests,
          desktopCount,
          mobileCount,
          tabletCount,
          topBrowser,
          topDevice,
        })
      }
    } catch (error) {
      console.error('Error fetching device stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceStats()
  }, [dateRange])

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      case 'desktop':
        return Monitor
      default:
        return Monitor
    }
  }

  const getDeviceColor = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
      case 'tablet':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950/30'
      case 'desktop':
        return 'text-green-600 bg-green-50 dark:bg-green-950/30'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  const calculatePercentage = (count: number) => {
    if (!summary || summary.totalTests === 0) return 0
    return ((count / summary.totalTests) * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Device Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Track device and browser usage across test attempts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range)}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchDeviceStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desktop Tests</CardTitle>
              <Monitor className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.desktopCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {calculatePercentage(summary.desktopCount)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Tests</CardTitle>
              <Smartphone className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.mobileCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {calculatePercentage(summary.mobileCount)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Browser</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.topBrowser}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Most popular choice
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Device & Browser Breakdown</CardTitle>
          <CardDescription>
            Detailed statistics by device type and browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No device data available for the selected period
            </div>
          ) : (
            <div className="space-y-3">
              {stats.map((stat, index) => {
                const DeviceIcon = getDeviceIcon(stat.device_type)
                const percentage = calculatePercentage(stat.count)
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "rounded-full p-3",
                        getDeviceColor(stat.device_type)
                      )}>
                        <DeviceIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize">
                            {stat.device_type}
                          </span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {stat.browser_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Avg Screen: {Math.round(stat.avg_screen_width)}x{Math.round(stat.avg_screen_height)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{stat.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Card */}
      {summary && summary.totalTests > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              • <strong>{calculatePercentage(summary.desktopCount)}%</strong> of tests are taken on desktop devices
            </p>
            <p>
              • <strong>{summary.topBrowser}</strong> is the most popular browser
            </p>
            <p>
              • <strong>{summary.mobileCount}</strong> students attempted tests on mobile devices
            </p>
            {summary.mobileCount > summary.desktopCount * 0.3 && (
              <p className="text-amber-700 dark:text-amber-400">
                ⚠️ Consider optimizing mobile experience - {calculatePercentage(summary.mobileCount)}% mobile usage
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
