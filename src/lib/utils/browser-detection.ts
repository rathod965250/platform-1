/**
 * Browser and device information detection utilities
 * Captures detailed information about user's browser and device for analytics
 */

export interface BrowserInfo {
  name: string
  version: string
  userAgent: string
}

export interface OSInfo {
  name: string
  version: string
}

export interface ConnectionInfo {
  type: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  browser: BrowserInfo
  os: OSInfo
  connection?: ConnectionInfo
  timezone: string
}

/**
 * Detects browser name and version
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'

  // Chrome
  if (/Chrome/.test(userAgent) && !/Chromium|Edg/.test(userAgent)) {
    browserName = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }
  // Edge (Chromium-based)
  else if (/Edg/.test(userAgent)) {
    browserName = 'Edge'
    const match = userAgent.match(/Edg\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }
  // Firefox
  else if (/Firefox/.test(userAgent)) {
    browserName = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }
  // Safari
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browserName = 'Safari'
    const match = userAgent.match(/Version\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }
  // Opera
  else if (/OPR/.test(userAgent) || /Opera/.test(userAgent)) {
    browserName = 'Opera'
    const match = userAgent.match(/(?:OPR|Opera)\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }
  // Samsung Internet
  else if (/SamsungBrowser/.test(userAgent)) {
    browserName = 'Samsung Internet'
    const match = userAgent.match(/SamsungBrowser\/(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }
  // Internet Explorer
  else if (/MSIE|Trident/.test(userAgent)) {
    browserName = 'Internet Explorer'
    const match = userAgent.match(/(?:MSIE |rv:)(\d+\.\d+)/)
    if (match) browserVersion = match[1]
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent,
  }
}

/**
 * Detects operating system name and version
 */
export function detectOS(): OSInfo {
  const userAgent = navigator.userAgent
  let osName = 'Unknown'
  let osVersion = 'Unknown'

  // Windows
  if (/Windows NT/.test(userAgent)) {
    osName = 'Windows'
    const match = userAgent.match(/Windows NT (\d+\.\d+)/)
    if (match) {
      const ntVersion = match[1]
      // Map NT version to Windows version
      const versionMap: Record<string, string> = {
        '10.0': '10/11',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
      }
      osVersion = versionMap[ntVersion] || ntVersion
    }
  }
  // macOS
  else if (/Mac OS X/.test(userAgent)) {
    osName = 'macOS'
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
    if (match) osVersion = match[1].replace(/_/g, '.')
  }
  // iOS
  else if (/iPhone|iPad|iPod/.test(userAgent)) {
    osName = 'iOS'
    const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/)
    if (match) osVersion = match[1].replace(/_/g, '.')
  }
  // Android
  else if (/Android/.test(userAgent)) {
    osName = 'Android'
    const match = userAgent.match(/Android (\d+\.\d+)/)
    if (match) osVersion = match[1]
  }
  // Linux
  else if (/Linux/.test(userAgent)) {
    osName = 'Linux'
  }
  // Chrome OS
  else if (/CrOS/.test(userAgent)) {
    osName = 'Chrome OS'
  }

  return {
    name: osName,
    version: osVersion,
  }
}

/**
 * Detects network connection information
 */
export function detectConnection(): ConnectionInfo | undefined {
  // @ts-ignore - NetworkInformation API not in TypeScript types yet
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) return undefined

  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
  }
}

/**
 * Gets complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  const width = window.screen.width
  const height = window.screen.height
  const pixelRatio = window.devicePixelRatio || 1
  const userAgent = navigator.userAgent.toLowerCase()

  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown'
  let isMobile = false
  let isTablet = false
  let isDesktop = false

  // Check user agent for mobile/tablet indicators
  const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTabletUA = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(userAgent)

  // Determine device type based on screen size and user agent
  if (width < 768) {
    deviceType = 'mobile'
    isMobile = true
  } else if (width >= 768 && width < 1024) {
    deviceType = isTabletUA ? 'tablet' : 'desktop'
    isTablet = isTabletUA
    isDesktop = !isTabletUA
  } else {
    deviceType = isTabletUA ? 'tablet' : 'desktop'
    isTablet = isTabletUA
    isDesktop = !isTabletUA
  }

  // Get browser and OS info
  const browser = detectBrowser()
  const os = detectOS()
  const connection = detectConnection()

  // Get timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return {
    deviceType,
    screenWidth: width,
    screenHeight: height,
    pixelRatio,
    isMobile,
    isTablet,
    isDesktop,
    browser,
    os,
    connection,
    timezone,
  }
}

/**
 * Formats device info for display
 */
export function formatDeviceInfo(info: DeviceInfo): string {
  return `${info.deviceType} | ${info.browser.name} ${info.browser.version} | ${info.os.name} ${info.os.version} | ${info.screenWidth}x${info.screenHeight}`
}

/**
 * Gets a simplified device summary
 */
export function getDeviceSummary(): string {
  const info = getDeviceInfo()
  return `${info.deviceType.charAt(0).toUpperCase() + info.deviceType.slice(1)} - ${info.browser.name}`
}
