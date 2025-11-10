/**
 * Date and time formatting utilities with timezone support
 * Provides accurate date/time formatting based on user's timezone
 */

/**
 * Gets the user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Formats a date with timezone information
 * @param date - Date to format (defaults to now)
 * @param options - Intl.DateTimeFormat options
 */
export function formatDateWithTimezone(
  date: Date = new Date(),
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date)
}

/**
 * Formats a time with timezone information
 * @param date - Date to format (defaults to now)
 * @param options - Intl.DateTimeFormat options
 */
export function formatTimeWithTimezone(
  date: Date = new Date(),
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options,
  }

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date)
}

/**
 * Formats a complete date and time with timezone
 * @param date - Date to format (defaults to now)
 * @param includeSeconds - Whether to include seconds (default: false)
 */
export function formatDateTimeWithTimezone(
  date: Date = new Date(),
  includeSeconds: boolean = false
): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: true,
  }

  const datePart = new Intl.DateTimeFormat('en-US', dateOptions).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', timeOptions).format(date)

  return `${datePart} ${timePart}`
}

/**
 * Formats date for test titles
 * Format: MM/DD/YYYY HH:MM AM/PM
 * @param date - Date to format (defaults to now)
 */
export function formatTestTitleDate(date: Date = new Date()): string {
  return formatDateTimeWithTimezone(date, false)
}

/**
 * Formats date for display with timezone abbreviation
 * Format: MM/DD/YYYY HH:MM AM/PM (Timezone)
 * @param date - Date to format (defaults to now)
 */
export function formatDateTimeWithTimezoneAbbr(date: Date = new Date()): string {
  const dateTime = formatDateTimeWithTimezone(date, false)
  const timezone = getUserTimezone()
  
  // Get timezone abbreviation (e.g., PST, EST, IST)
  const tzAbbr = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value || timezone

  return `${dateTime} (${tzAbbr})`
}

/**
 * Formats date in ISO format for database storage
 * @param date - Date to format (defaults to now)
 */
export function formatISODate(date: Date = new Date()): string {
  return date.toISOString()
}

/**
 * Formats date in a human-readable format
 * Format: January 15, 2025 at 3:45 PM
 * @param date - Date to format (defaults to now)
 */
export function formatHumanReadableDate(date: Date = new Date()): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }

  const datePart = new Intl.DateTimeFormat('en-US', dateOptions).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', timeOptions).format(date)

  return `${datePart} at ${timePart}`
}

/**
 * Formats date for file names (no special characters)
 * Format: YYYY-MM-DD_HH-MM-SS
 * @param date - Date to format (defaults to now)
 */
export function formatDateForFileName(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to compare
 * @param baseDate - Base date to compare against (defaults to now)
 */
export function getRelativeTimeString(
  date: Date,
  baseDate: Date = new Date()
): string {
  const diffMs = date.getTime() - baseDate.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffDay) >= 1) {
    return rtf.format(diffDay, 'day')
  } else if (Math.abs(diffHour) >= 1) {
    return rtf.format(diffHour, 'hour')
  } else if (Math.abs(diffMin) >= 1) {
    return rtf.format(diffMin, 'minute')
  } else {
    return rtf.format(diffSec, 'second')
  }
}

/**
 * Formats duration in minutes to human-readable format
 * @param minutes - Duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`
}
