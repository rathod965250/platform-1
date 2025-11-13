'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CircleCheck, 
  CircleX, 
  Loader2, 
  Monitor, 
  Wifi, 
  Camera, 
  Mic,
  Battery,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDeviceType, isDesktopDevice, getDeviceName } from '@/lib/utils/device-detection'

interface SystemCheck {
  status: 'checking' | 'success' | 'warning' | 'error'
  message: string
  details?: string
}

interface SystemChecks {
  display: SystemCheck
  internet: SystemCheck
  camera: SystemCheck
  audio: SystemCheck
  battery: SystemCheck
}

export function SystemCheckCard() {
  const [isDesktop, setIsDesktop] = useState(true) // Default to true for SSR
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [checks, setChecks] = useState<SystemChecks>({
    display: { status: 'checking', message: 'Checking...' },
    internet: { status: 'checking', message: 'Checking...' },
    camera: { status: 'checking', message: 'Checking...' },
    audio: { status: 'checking', message: 'Checking...' },
    battery: { status: 'checking', message: 'Checking...' },
  })
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [internetSpeed, setInternetSpeed] = useState<number | null>(null)

  // Detect device type on mount
  useEffect(() => {
    setIsDesktop(isDesktopDevice())
    setDeviceType(getDeviceType())
  }, [])

  // Check Display Compatibility
  const checkDisplay = useCallback(async () => {
    try {
      const width = window.screen.width
      const height = window.screen.height
      const pixelRatio = window.devicePixelRatio || 1
      const colorDepth = window.screen.colorDepth
      
      // Check if resolution is adequate (minimum 1024x768)
      if (width < 1024 || height < 768) {
        setChecks(prev => ({
          ...prev,
          display: {
            status: 'warning',
            message: 'Low Resolution',
            details: `${width}x${height} - Recommended: 1024x768 or higher`
          }
        }))
      } else {
        setChecks(prev => ({
          ...prev,
          display: {
            status: 'success',
            message: 'Optimal',
            details: `${width}x${height} @ ${pixelRatio}x, ${colorDepth}-bit color`
          }
        }))
      }
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        display: {
          status: 'error',
          message: 'Check Failed',
          details: 'Unable to detect display properties'
        }
      }))
    }
  }, [])

  // Check Internet Stability with Speed Test
  const checkInternet = useCallback(async () => {
    try {
      // Check if online
      if (!navigator.onLine) {
        setChecks(prev => ({
          ...prev,
          internet: {
            status: 'error',
            message: 'No Connection',
            details: 'Please check your internet connection'
          }
        }))
        return
      }

      // Measure connection speed
      const startTime = performance.now()
      const cacheBuster = '?t=' + new Date().getTime()
      
      try {
        // Use a stable CDN image for speed test; compute size from response
        const response = await fetch(`https://placehold.co/1000x1000/png${cacheBuster}`, {
          cache: 'no-cache'
        })
        
        if (!response.ok) throw new Error('Network response failed')
        
        const blob = await response.blob()
        const endTime = performance.now()
        const duration = (endTime - startTime) / 1000 // Convert to seconds
        const bytes = blob.size
        const speedMbps = ((bytes * 8) / (duration * 1000000)).toFixed(2) // Convert to Mbps based on actual size
        
        setInternetSpeed(parseFloat(speedMbps))
        
        if (parseFloat(speedMbps) < 1) {
          setChecks(prev => ({
            ...prev,
            internet: {
              status: 'warning',
              message: 'Slow Connection',
              details: `${speedMbps} Mbps - May affect test performance`
            }
          }))
        } else {
          setChecks(prev => ({
            ...prev,
            internet: {
              status: 'success',
              message: 'Stable',
              details: `~${speedMbps} Mbps - Connection is good`
            }
          }))
        }
      } catch (fetchError) {
        // Fallback: Just check connectivity
        setChecks(prev => ({
          ...prev,
          internet: {
            status: 'success',
            message: 'Connected',
            details: 'Online (speed test unavailable)'
          }
        }))
      }
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        internet: {
          status: 'error',
          message: 'Check Failed',
          details: 'Unable to verify connection'
        }
      }))
    }
  }, [])

  // Check Camera Access
  const checkCamera = useCallback(async () => {
    try {
      // Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setChecks(prev => ({
          ...prev,
          camera: {
            status: 'error',
            message: 'Not Supported',
            details: 'Camera API not available in this browser'
          }
        }))
        return
      }

      // Check for camera devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        setChecks(prev => ({
          ...prev,
          camera: {
            status: 'warning',
            message: 'No Camera Found',
            details: 'No camera devices detected'
          }
        }))
        return
      }

      // Try to access camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        
        // Stop the stream immediately after verification
        stream.getTracks().forEach(track => track.stop())
        
        setChecks(prev => ({
          ...prev,
          camera: {
            status: 'success',
            message: 'Available',
            details: `${videoDevices.length} camera(s) detected and accessible`
          }
        }))
      } catch (permissionError: any) {
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setChecks(prev => ({
            ...prev,
            camera: {
              status: 'warning',
              message: 'Permission Denied',
              details: 'Please allow camera access in browser settings'
            }
          }))
        } else {
          setChecks(prev => ({
            ...prev,
            camera: {
              status: 'error',
              message: 'Access Failed',
              details: permissionError.message || 'Unable to access camera'
            }
          }))
        }
      }
    } catch (error: any) {
      setChecks(prev => ({
        ...prev,
        camera: {
          status: 'error',
          message: 'Check Failed',
          details: error.message || 'Unable to check camera'
        }
      }))
    }
  }, [])

  // Check Audio/Microphone Access
  const checkAudio = useCallback(async () => {
    try {
      // Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setChecks(prev => ({
          ...prev,
          audio: {
            status: 'error',
            message: 'Not Supported',
            details: 'Audio API not available in this browser'
          }
        }))
        return
      }

      // Check for audio devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(device => device.kind === 'audioinput')
      
      if (audioDevices.length === 0) {
        setChecks(prev => ({
          ...prev,
          audio: {
            status: 'warning',
            message: 'No Microphone Found',
            details: 'No audio input devices detected'
          }
        }))
        return
      }

      // Try to access microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        })
        
        // Stop the stream immediately after verification
        stream.getTracks().forEach(track => track.stop())
        
        setChecks(prev => ({
          ...prev,
          audio: {
            status: 'success',
            message: 'Available',
            details: `${audioDevices.length} microphone(s) detected and accessible`
          }
        }))
      } catch (permissionError: any) {
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setChecks(prev => ({
            ...prev,
            audio: {
              status: 'warning',
              message: 'Permission Denied',
              details: 'Please allow microphone access in browser settings'
            }
          }))
        } else {
          setChecks(prev => ({
            ...prev,
            audio: {
              status: 'error',
              message: 'Access Failed',
              details: permissionError.message || 'Unable to access microphone'
            }
          }))
        }
      }
    } catch (error: any) {
      setChecks(prev => ({
        ...prev,
        audio: {
          status: 'error',
          message: 'Check Failed',
          details: error.message || 'Unable to check audio'
        }
      }))
    }
  }, [])

  // Check Battery Status
  const checkBattery = useCallback(async () => {
    try {
      // @ts-ignore - Battery API is not in TypeScript types yet
      if ('getBattery' in navigator) {
        // @ts-ignore
        const battery = await navigator.getBattery()
        const level = Math.round(battery.level * 100)
        const charging = battery.charging
        
        if (!charging && level < 20) {
          setChecks(prev => ({
            ...prev,
            battery: {
              status: 'warning',
              message: 'Low Battery',
              details: `${level}% - Please connect charger`
            }
          }))
        } else if (!charging && level < 50) {
          setChecks(prev => ({
            ...prev,
            battery: {
              status: 'warning',
              message: 'Medium Battery',
              details: `${level}% - Consider connecting charger`
            }
          }))
        } else {
          setChecks(prev => ({
            ...prev,
            battery: {
              status: 'success',
              message: charging ? 'Charging' : 'Good',
              details: `${level}%${charging ? ' (Charging)' : ''}`
            }
          }))
        }
      } else {
        // Battery API not supported (desktop browsers)
        setChecks(prev => ({
          ...prev,
          battery: {
            status: 'success',
            message: 'N/A',
            details: 'Battery status not available (likely desktop)'
          }
        }))
      }
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        battery: {
          status: 'success',
          message: 'N/A',
          details: 'Battery check not supported'
        }
      }))
    }
  }, [])

  // Run all checks
  const runAllChecks = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      checkDisplay(),
      checkInternet(),
      checkCamera(),
      checkAudio(),
      checkBattery(),
    ])
    setIsRefreshing(false)
  }, [checkDisplay, checkInternet, checkCamera, checkAudio, checkBattery])

  // Run checks on mount (only for desktop devices)
  useEffect(() => {
    // Only run checks if on desktop
    if (!isDesktop) return

    runAllChecks()

    // Listen for online/offline events
    const handleOnline = () => checkInternet()
    const handleOffline = () => {
      setChecks(prev => ({
        ...prev,
        internet: {
          status: 'error',
          message: 'Disconnected',
          details: 'Internet connection lost'
        }
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic internet check every 30 seconds
    const intervalId = setInterval(checkInternet, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [isDesktop, runAllChecks, checkInternet])

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'success':
        return <CircleCheck className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <CircleX className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
    }
  }

  const CheckItem = ({ 
    icon: Icon, 
    label, 
    check 
  }: { 
    icon: any, 
    label: string, 
    check: SystemCheck 
  }) => (
    <div className={cn(
      "flex items-center justify-between rounded-lg border p-3 transition-colors",
      getStatusColor(check.status)
    )}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        <div>
          <span className="text-sm font-medium">{label}</span>
          {check.details && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {check.details}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">{check.message}</span>
        {getStatusIcon(check.status)}
      </div>
    </div>
  )

  const allChecksPass = Object.values(checks).every(
    check => check.status === 'success' || check.status === 'warning'
  )

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Laptop
    }
  }

  // Show device recommendation for mobile/tablet users
  if (!isDesktop) {
    const DeviceIcon = getDeviceIcon()
    
    return (
      <Card className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
              <DeviceIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-amber-900 dark:text-amber-100">
                Device Recommendation
              </CardTitle>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Current Device: {getDeviceName(deviceType)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border-2 border-amber-300 bg-white p-4 dark:border-amber-700 dark:bg-gray-900">
            <Laptop className="h-8 w-8 shrink-0 text-amber-600 dark:text-amber-400 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                For Better Test Experience
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                We recommend taking tests on devices with bigger screens such as{' '}
                <strong>laptops or desktop computers</strong> for the best experience.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
              Benefits of using a laptop/desktop:
            </h5>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                <span>Larger screen for better question visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                <span>More stable internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                <span>Better camera and microphone quality for proctoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                <span>Longer battery life and power options</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                <span>Full-screen mode support for focused testing</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> You can still proceed with the test on this device, but 
              switching to a laptop or desktop is highly recommended for optimal performance.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show real-time system checks for desktop users
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Check</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runAllChecks}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CheckItem icon={Monitor} label="Display" check={checks.display} />
        <CheckItem icon={Wifi} label="Internet" check={checks.internet} />
        <CheckItem icon={Camera} label="Camera" check={checks.camera} />
        <CheckItem icon={Mic} label="Microphone" check={checks.audio} />
        <CheckItem icon={Battery} label="Battery" check={checks.battery} />
        
        {!allChecksPass && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Some checks failed. Please resolve issues before starting the test.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
