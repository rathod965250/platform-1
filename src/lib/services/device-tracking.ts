/**
 * Device tracking service
 * Saves device and browser information to the database for analytics
 */

import { createClient } from '@/lib/supabase/client'
import { getDeviceInfo } from '@/lib/utils/browser-detection'
import type { DeviceInfo } from '@/lib/utils/browser-detection'

export interface TestDeviceInfo {
  test_attempt_id?: string
  user_id: string
  test_id: string
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  screen_width: number
  screen_height: number
  pixel_ratio: number
  browser_name: string
  browser_version: string
  user_agent: string
  os_name: string
  os_version: string
  is_mobile: boolean
  is_tablet: boolean
  is_desktop: boolean
  connection_type?: string
  timezone: string
}

/**
 * Saves device information to the database
 */
export async function saveDeviceInfo(
  userId: string,
  testId: string,
  testAttemptId?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = createClient()
    const deviceInfo = getDeviceInfo()

    const deviceData: TestDeviceInfo = {
      user_id: userId,
      test_id: testId,
      ...(testAttemptId && { test_attempt_id: testAttemptId }),
      device_type: deviceInfo.deviceType,
      screen_width: deviceInfo.screenWidth,
      screen_height: deviceInfo.screenHeight,
      pixel_ratio: deviceInfo.pixelRatio,
      browser_name: deviceInfo.browser.name,
      browser_version: deviceInfo.browser.version,
      user_agent: deviceInfo.browser.userAgent,
      os_name: deviceInfo.os.name,
      os_version: deviceInfo.os.version,
      is_mobile: deviceInfo.isMobile,
      is_tablet: deviceInfo.isTablet,
      is_desktop: deviceInfo.isDesktop,
      connection_type: deviceInfo.connection?.effectiveType || deviceInfo.connection?.type,
      timezone: deviceInfo.timezone,
    }

    const { data, error } = await supabase
      .from('test_device_info')
      .insert(deviceData)
      .select()
      .single()

    if (error) {
      console.error('Error saving device info:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in saveDeviceInfo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Gets device statistics for a user
 */
export async function getUserDeviceStats(userId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('test_device_info')
      .select('device_type, browser_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      byDevice: {} as Record<string, number>,
      byBrowser: {} as Record<string, number>,
      mostUsedDevice: '',
      mostUsedBrowser: '',
    }

    data?.forEach((item: { device_type: string; browser_name: string; created_at: string }) => {
      // Count by device
      stats.byDevice[item.device_type] = (stats.byDevice[item.device_type] || 0) + 1

      // Count by browser
      stats.byBrowser[item.browser_name] = (stats.byBrowser[item.browser_name] || 0) + 1
    })

    // Find most used
    if (Object.keys(stats.byDevice).length > 0) {
      stats.mostUsedDevice = Object.entries(stats.byDevice).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0]
    }

    if (Object.keys(stats.byBrowser).length > 0) {
      stats.mostUsedBrowser = Object.entries(stats.byBrowser).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0]
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Error getting user device stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Gets device statistics for admin dashboard
 */
export async function getDeviceStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const supabase = createClient()

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate || new Date()

    const { data, error } = await supabase.rpc('get_device_statistics', {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error getting device statistics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Checks if device meets minimum requirements
 */
export function checkDeviceRequirements(deviceInfo?: DeviceInfo): {
  meetsRequirements: boolean
  warnings: string[]
  recommendations: string[]
} {
  const info = deviceInfo || getDeviceInfo()
  const warnings: string[] = []
  const recommendations: string[] = []

  // Check screen resolution
  if (info.screenWidth < 1024 || info.screenHeight < 768) {
    warnings.push('Screen resolution is below recommended minimum (1024x768)')
    recommendations.push('Use a device with a larger screen for better experience')
  }

  // Check device type
  if (info.deviceType === 'mobile') {
    warnings.push('Mobile devices may have limited functionality')
    recommendations.push('Consider using a laptop or desktop for optimal experience')
  }

  // Check browser
  const unsupportedBrowsers = ['Internet Explorer']
  if (unsupportedBrowsers.includes(info.browser.name)) {
    warnings.push(`${info.browser.name} is not fully supported`)
    recommendations.push('Please use Chrome, Firefox, Safari, or Edge for best experience')
  }

  // Check connection
  if (info.connection?.effectiveType === 'slow-2g' || info.connection?.effectiveType === '2g') {
    warnings.push('Slow internet connection detected')
    recommendations.push('Connect to a faster network for better performance')
  }

  const meetsRequirements = warnings.length === 0

  return {
    meetsRequirements,
    warnings,
    recommendations,
  }
}
