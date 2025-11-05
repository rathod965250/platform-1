/**
 * Utility functions for Supabase query result sanitization
 * 
 * Supabase PostgREST can sometimes return metadata objects with keys like
 * {cardinality, embedding, relationship} when relationships are involved.
 * These functions help filter out this metadata and ensure clean data.
 */

/**
 * Check if an object is Supabase metadata (has cardinality, embedding, or relationship keys)
 */
export function isSupabaseMetadata(obj: any): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }
  return 'cardinality' in obj || 'embedding' in obj || 'relationship' in obj
}

/**
 * Sanitize a Supabase query result by filtering out metadata objects
 */
export function sanitizeSupabaseResult<T>(data: T | T[] | null): T | T[] | null {
  if (!data) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeObject(item)) as T[]
  }

  return sanitizeObject(data) as T
}

/**
 * Recursively sanitize an object, removing Supabase metadata
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  // If this is a metadata object, return null
  if (isSupabaseMetadata(obj)) {
    return null
  }

  // Recursively sanitize nested objects
  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip metadata keys
    if (['cardinality', 'embedding', 'relationship'].includes(key)) {
      continue
    }

    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeObject(item))
    } else if (value && typeof value === 'object') {
      const sanitizedValue = sanitizeObject(value)
      // Only include if it's not null (which would indicate it was metadata)
      if (sanitizedValue !== null) {
        sanitized[key] = sanitizedValue
      }
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Extract relationship data from Supabase query result
 * Handles cases where relationship might be an array or metadata object
 */
export function extractRelationship<T>(
  relationship: T | T[] | any | null | undefined
): T | null {
  if (!relationship) {
    return null
  }

  // If it's an array, take the first element
  if (Array.isArray(relationship)) {
    const first = relationship[0]
    // Check if it's metadata
    if (isSupabaseMetadata(first)) {
      return null
    }
    return first as T
  }

  // If it's a metadata object, return null
  if (isSupabaseMetadata(relationship)) {
    return null
  }

  // Otherwise return as-is
  return relationship as T
}

