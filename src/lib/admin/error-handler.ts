/**
 * Admin Error Handler Utility
 * 
 * Provides standardized error handling and logging for admin operations
 */

export interface AdminErrorDetails {
  message: string
  code?: string
  details?: string
  hint?: string
  status?: number
  statusText?: string
}

export interface SupabaseError {
  message?: string
  code?: string
  details?: string
  hint?: string
  status?: number
  statusText?: string
}

/**
 * Extract error details from Supabase error object
 */
export function extractErrorDetails(error: unknown): AdminErrorDetails {
  if (!error) {
    return {
      message: 'Unknown error occurred',
    }
  }

  // Handle Supabase error format
  if (typeof error === 'object' && 'message' in error) {
    const supabaseError = error as SupabaseError
    return {
      message: supabaseError.message || 'Unknown error occurred',
      code: supabaseError.code,
      details: supabaseError.details,
      hint: supabaseError.hint,
      status: supabaseError.status,
      statusText: supabaseError.statusText,
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  // Fallback for unknown error types
  return {
    message: String(error),
  }
}

/**
 * Log error with detailed information
 */
export function logAdminError(context: string, error: unknown): void {
  const errorDetails = extractErrorDetails(error)
  
  // Structured error logging
  console.error(`[${context}] Error:`, JSON.stringify(errorDetails, null, 2))
  
  // Also log raw error for debugging
  console.error(`[${context}] Raw error:`, error)
  
  // Log specific messages for common error codes
  if (errorDetails.code === 'PGRST116') {
    console.error(`[${context}] No rows found - this might be expected if no data exists`)
  } else if (errorDetails.code === '42501') {
    console.error(`[${context}] Permission denied - check RLS policies`)
  } else if (errorDetails.code === 'PGRST301') {
    console.error(`[${context}] JWT error - authentication issue`)
  } else if (errorDetails.code === '42703') {
    console.error(`[${context}] Column does not exist - check database schema`)
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const errorDetails = extractErrorDetails(error)
  
  // Return a user-friendly message
  if (errorDetails.message) {
    return errorDetails.message
  }
  
  // Fallback messages based on error code
  switch (errorDetails.code) {
    case 'PGRST116':
      return 'No data found. This might be expected if no records exist.'
    case '42501':
      return 'Permission denied. Please check your access permissions.'
    case 'PGRST301':
      return 'Authentication error. Please log in again.'
    case '42703':
      return 'Database schema error. Please contact support.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
