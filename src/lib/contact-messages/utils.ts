/**
 * Utility functions for parsing and displaying multiple replies in contact messages
 * 
 * Multiple replies are stored in a single TEXT field with separators:
 * Format: "Reply 1\n\n---\n\n[Additional Reply - timestamp]\n\nReply 2"
 */

export interface ParsedReply {
  text: string
  timestamp?: string
  isFirst: boolean
}

/**
 * Parse multiple replies from a single reply TEXT field
 * Splits replies by the separator pattern
 */
export function parseMultipleReplies(replyText: string | null | undefined): ParsedReply[] {
  if (!replyText || typeof replyText !== 'string') {
    return []
  }

  // Split by the separator pattern
  const separator = '\n\n---\n\n'
  const parts = replyText.split(separator)

  if (parts.length === 1) {
    // Single reply, no separator found
    return [{
      text: replyText.trim(),
      isFirst: true,
    }]
  }

  // Parse each part
  return parts.map((part, index) => {
    const trimmed = part.trim()
    
    // Check if this part has a timestamp header like "[Additional Reply - Dec 15, 2024, 10:30 AM]"
    const timestampMatch = trimmed.match(/^\[Additional Reply - (.+?)\]\n\n(.*)$/s)
    
    if (timestampMatch) {
      return {
        text: timestampMatch[2].trim(),
        timestamp: timestampMatch[1].trim(),
        isFirst: false,
      }
    }
    
    // First reply doesn't have timestamp header
    return {
      text: trimmed,
      isFirst: index === 0,
    }
  })
}

/**
 * Check if a reply contains multiple replies
 */
export function hasMultipleReplies(replyText: string | null | undefined): boolean {
  if (!replyText || typeof replyText !== 'string') {
    return false
  }
  return replyText.includes('\n\n---\n\n')
}

/**
 * Get the count of replies in a reply text
 */
export function getReplyCount(replyText: string | null | undefined): number {
  if (!replyText || typeof replyText !== 'string') {
    return 0
  }
  const parsed = parseMultipleReplies(replyText)
  return parsed.length
}

