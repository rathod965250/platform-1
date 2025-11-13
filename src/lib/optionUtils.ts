/**
 * Utility functions for handling option keys and letters
 */

/**
 * Converts option key (e.g., "option b") to uppercase letter (e.g., "B")
 * @param optionKey The option key to convert
 * @returns Uppercase letter (A, B, C, D, E) or null if invalid
 */
export function optionKeyToLetter(optionKey: string | null): string | null {
  if (!optionKey) return null
  
  const match = optionKey.toLowerCase().match(/option\s+([a-e])/)
  return match ? match[1].toUpperCase() : null
}

/**
 * Converts uppercase letter (e.g., "B") to option key (e.g., "option b")
 * @param letter The uppercase letter to convert
 * @returns Option key or null if invalid
 */
export function letterToOptionKey(letter: string | null): string | null {
  if (!letter) return null
  
  const validLetters = ['A', 'B', 'C', 'D', 'E']
  const upperLetter = letter.toUpperCase()
  
  if (validLetters.includes(upperLetter)) {
    return `option ${upperLetter.toLowerCase()}`
  }
  
  return null
}

/**
 * Gets the letter from an option key for display purposes
 * @param optionKey The option key
 * @returns Display letter or empty string
 */
export function getDisplayLetter(optionKey: string): string {
  const letter = optionKeyToLetter(optionKey)
  return letter || ''
}
