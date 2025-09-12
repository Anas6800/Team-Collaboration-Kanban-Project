/**
 * Utility functions for user avatars
 */

// Predefined color combinations for avatars
const AVATAR_COLORS = [
  { from: 'from-blue-500', to: 'to-blue-600', bg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
  { from: 'from-green-500', to: 'to-green-600', bg: 'bg-gradient-to-r from-green-500 to-green-600' },
  { from: 'from-red-500', to: 'to-red-600', bg: 'bg-gradient-to-r from-red-500 to-red-600' },
  { from: 'from-orange-500', to: 'to-orange-600', bg: 'bg-gradient-to-r from-orange-500 to-orange-600' },
  { from: 'from-pink-500', to: 'to-pink-600', bg: 'bg-gradient-to-r from-pink-500 to-pink-600' },
  { from: 'from-indigo-500', to: 'to-indigo-600', bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
  { from: 'from-teal-500', to: 'to-teal-600', bg: 'bg-gradient-to-r from-teal-500 to-teal-600' },
  { from: 'from-cyan-500', to: 'to-cyan-600', bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600' },
  { from: 'from-emerald-500', to: 'to-emerald-600', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
  { from: 'from-lime-500', to: 'to-lime-600', bg: 'bg-gradient-to-r from-lime-500 to-lime-600' },
  { from: 'from-amber-500', to: 'to-amber-600', bg: 'bg-gradient-to-r from-amber-500 to-amber-600' },
  { from: 'from-rose-500', to: 'to-rose-600', bg: 'bg-gradient-to-r from-rose-500 to-rose-600' },
  { from: 'from-violet-500', to: 'to-violet-600', bg: 'bg-gradient-to-r from-violet-500 to-violet-600' },
  { from: 'from-slate-500', to: 'to-slate-600', bg: 'bg-gradient-to-r from-slate-500 to-slate-600' },
]

/**
 * Generate a simple hash from a string
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get user initials from full name
 * Examples:
 * - "John Doe" -> "JD"
 * - "Alex" -> "A"
 * - "Mary Jane Watson" -> "MW" (first + last)
 * - "user@example.com" -> "U"
 */
export function getUserInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?'
  }
  
  const cleanName = name.trim()
  
  // If it looks like an email, use the part before @
  if (cleanName.includes('@')) {
    const emailName = cleanName.split('@')[0]
    return getUserInitials(emailName)
  }
  
  // Split by spaces and filter out empty strings
  const nameParts = cleanName.split(' ').filter(part => part.length > 0)
  
  if (nameParts.length === 0) {
    return '?'
  } else if (nameParts.length === 1) {
    // Single name: use first character
    return nameParts[0].charAt(0).toUpperCase()
  } else {
    // Multiple names: use first character of first and last parts
    const firstInitial = nameParts[0].charAt(0).toUpperCase()
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    return `${firstInitial}${lastInitial}`
  }
}

/**
 * Get consistent avatar color based on user name
 * Uses the full name to generate a hash, ensuring users with different names
 * but same initials get different colors
 */
export function getAvatarColor(name: string): typeof AVATAR_COLORS[0] {
  if (!name || name.trim().length === 0) {
    // Default color for empty/invalid names
    return AVATAR_COLORS[0]
  }
  
  // Normalize the name (lowercase, trim) for consistency
  const normalizedName = name.toLowerCase().trim()
  
  // Generate hash from the full name
  const hash = hashString(normalizedName)
  
  // Use modulo to map hash to available colors
  const colorIndex = hash % AVATAR_COLORS.length
  
  return AVATAR_COLORS[colorIndex]
}

/**
 * Get avatar props for a user (combines initials and color)
 */
export function getAvatarProps(name: string) {
  return {
    initials: getUserInitials(name),
    color: getAvatarColor(name),
  }
}

/**
 * Generate full CSS classes for avatar background
 */
export function getAvatarBackgroundClasses(name: string): string {
  const color = getAvatarColor(name)
  return color.bg
}
