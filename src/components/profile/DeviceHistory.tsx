'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Monitor, Smartphone, Tablet, Chrome, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { formatHumanReadableDate } from '@/lib/utils/date-formatter'

interface DeviceRecord {
  id: string
  device_type: string
  browser_name: string
  browser_version: string
  os_name: string
  screen_width: number
  screen_height: number
  created_at: string
  test: {
    title: string
  }
}

export function DeviceHistory({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<DeviceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDeviceHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('test_device_info')
          .select(`
            id,
            device_type,
            browser_name,
            browser_version,
            os_name,
            screen_width,
            screen_height,
            created_at,
            test:tests(title)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setDevices(data || [])
      } catch (error) {
        console.error('Error fetching device history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeviceHistory()
  }, [userId])

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device History</CardTitle>
        <CardDescription>
          Recent devices used for taking tests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No device history available
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.device_type)
              
              return (
                <div
                  key={device.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={cn(
                    "rounded-full p-2 shrink-0",
                    getDeviceColor(device.device_type)
                  )}>
                    <DeviceIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold capitalize text-sm">
                        {device.device_type}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {device.browser_name} {device.browser_version}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {device.os_name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {device.screen_width}x{device.screen_height} • {device.test?.title || 'Unknown Test'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatHumanReadableDate(new Date(device.created_at))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
