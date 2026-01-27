/**
 * Parse relative time strings like "now", "now-7d", "now-1h" to Unix timestamps
 *
 * Supports Gemini-style relative time formats
 */

const RELATIVE_TIME_REGEX = /^now(?:-(\d+)(h|d|w|mo))?$/

/**
 * Parse relative time string to Unix timestamp (seconds)
 *
 * @param timeStr - Time string ("now", "now-7d", "now-1h", etc.)
 * @returns Unix timestamp in seconds
 *
 * @example
 * parseRelativeTime("now") // Current time
 * parseRelativeTime("now-7d") // 7 days ago
 * parseRelativeTime("now-1h") // 1 hour ago
 */
export function parseRelativeTime(timeStr: string): number {
  const now = Math.floor(Date.now() / 1000)

  // Handle "now"
  if (timeStr === 'now') {
    return now
  }

  // Parse "now-Xu" format
  const match = timeStr.match(RELATIVE_TIME_REGEX)
  if (!match) {
    throw new Error(
      `Invalid relative time format: "${timeStr}". Expected: "now", "now-1h", "now-7d", etc.`,
    )
  }

  const [, amount, unit] = match
  if (!amount || !unit) {
    return now
  }

  const value = parseInt(amount, 10)

  // Convert to seconds
  const multipliers: Record<string, number> = {
    h: 3600, // hours
    d: 86400, // days
    w: 604800, // weeks
    mo: 2592000, // months (30 days)
  }

  const multiplier = multipliers[unit]
  if (!multiplier) {
    throw new Error(`Unsupported time unit: ${unit}`)
  }

  return now - value * multiplier
}

/**
 * Check if a value is a relative time string
 */
export function isRelativeTime(value: unknown): boolean {
  return typeof value === 'string' && RELATIVE_TIME_REGEX.test(value)
}

/**
 * Parse time parameter that can be either:
 * - Number (Unix timestamp in seconds or milliseconds)
 * - Relative string ("now-7d")
 *
 * Automatically detects and converts milliseconds to seconds
 *
 * @param value - Time value (number or string)
 * @returns Unix timestamp in seconds
 */
export function parseTimeParam(
  value: number | string | undefined,
): number | undefined {
  if (value === undefined) return undefined

  if (typeof value === 'number') {
    // Detect if timestamp is in milliseconds (13+ digits) vs seconds (10 digits)
    // Unix timestamp in seconds for year 2000-2100 is 10 digits (946684800 - 4102444800)
    // Unix timestamp in milliseconds for year 2000-2100 is 13 digits
    if (value > 10000000000) {
      // Likely milliseconds, convert to seconds
      return Math.floor(value / 1000)
    }
    return value
  }

  if (typeof value === 'string') {
    return parseRelativeTime(value)
  }

  return undefined
}
