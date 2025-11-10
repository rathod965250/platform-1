/**
 * Device detection utilities
 * Helps identify device type for conditional features
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Detects the current device type based on screen size and user agent
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'desktop' // Default for SSR
  }

  const width = window.innerWidth
  const userAgent = navigator.userAgent.toLowerCase()

  // Check user agent for mobile/tablet indicators
  const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTabletUA = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(userAgent)

  // Screen size based detection
  if (width < 768) {
    return 'mobile'
  } else if (width >= 768 && width < 1024) {
    // If screen is tablet-sized, check user agent
    return isTabletUA ? 'tablet' : 'desktop'
  } else {
    // Larger screens - check if it's actually a tablet
    return isTabletUA ? 'tablet' : 'desktop'
  }
}

/**
 * Checks if the current device is a desktop/laptop
 */
export function isDesktopDevice(): boolean {
  return getDeviceType() === 'desktop'
}

/**
 * Checks if the current device is mobile or tablet
 */
export function isMobileOrTablet(): boolean {
  const deviceType = getDeviceType()
  return deviceType === 'mobile' || deviceType === 'tablet'
}

/**
 * Gets a user-friendly device name
 */
export function getDeviceName(type?: DeviceType): string {
  const deviceType = type || getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return 'Mobile Phone'
    case 'tablet':
      return 'Tablet'
    case 'desktop':
      return 'Desktop/Laptop'
    default:
      return 'Unknown Device'
  }
}

/**
 * Checks if screen size meets minimum requirements for tests
 */
export function meetsMinimumScreenRequirements(): boolean {
  if (typeof window === 'undefined') return true
  
  const width = window.innerWidth
  const height = window.innerHeight
  
  // Minimum recommended: 1024x768
  return width >= 1024 && height >= 768
}
