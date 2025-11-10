/**
 * Utility for consistent error logging across the application
 * Handles various error types and ensures meaningful error messages are logged
 */

/**
 * Safely extracts error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object') {
    // Handle Supabase errors
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    
    // Handle error objects with other message properties
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
    
    // Try to stringify the object
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  
  return 'Unknown error occurred'
}

/**
 * Logs error with context and proper formatting
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error)
  console.error(`❌ ${context}:`, message)
  
  // In development, also log the full error object for debugging
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    console.error('Full error:', error)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }
}

/**
 * Logs warning with context
 */
export function logWarning(context: string, message: string): void {
  console.warn(`⚠️ ${context}:`, message)
}

/**
 * Logs info with context
 */
export function logInfo(context: string, message: string): void {
  console.log(`ℹ️ ${context}:`, message)
}
