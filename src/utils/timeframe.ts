/**
 * Convert human-friendly timeframe strings to epoch seconds
 * Supports formats like: 1h, 6h, 24h, 7d, 1w, 30d, 90d
 */

export interface TimeRange {
  from: number // epoch seconds
  to: number // epoch seconds
}

/**
 * Parse timeframe string and return from/to epoch timestamps
 *
 * @param timeframe - Human-friendly time string (e.g., "1h", "7d", "1w")
 * @returns TimeRange object with from/to in epoch seconds
 *
 * Supported formats:
 * - Hours: 1h, 6h, 12h, 24h
 * - Days: 1d, 7d, 30d, 90d
 * - Weeks: 1w, 2w, 4w
 * - Months: 1mo, 3mo (approximated as 30/90 days)
 *
 * @example
 * parseTimeframe('1h')  // Last 1 hour
 * parseTimeframe('7d')  // Last 7 days
 * parseTimeframe('1w')  // Last 1 week (7 days)
 */
export function parseTimeframe(timeframe: string): TimeRange {
  const now = Math.floor(Date.now() / 1000)

  // Parse the timeframe string
  const match = timeframe.match(/^(\d+)(h|d|w|mo)$/)

  if (!match) {
    throw new Error(
      `Invalid timeframe format: "${timeframe}". Expected format: 1h, 6h, 24h, 7d, 1w, 30d, 90d, 1mo, 3mo`,
    )
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  let seconds = 0

  switch (unit) {
    case 'h': // hours
      seconds = value * 3600
      break
    case 'd': // days
      seconds = value * 86400
      break
    case 'w': // weeks
      seconds = value * 604800 // 7 days
      break
    case 'mo': // months (approximated as 30 days)
      seconds = value * 2592000 // 30 days
      break
    default:
      throw new Error(`Unknown time unit: ${unit}`)
  }

  // Enforce 90-day maximum
  const maxSeconds = 90 * 86400 // 90 days
  if (seconds > maxSeconds) {
    throw new Error(
      `Timeframe too large: ${timeframe}. Maximum is 90 days (90d or 3mo)`,
    )
  }

  return {
    from: now - seconds,
    to: now,
  }
}

/**
 * Common timeframe presets for convenience
 */
export const TIMEFRAME_PRESETS = {
  LAST_HOUR: '1h',
  LAST_6_HOURS: '6h',
  LAST_24_HOURS: '24h',
  LAST_DAY: '1d',
  LAST_WEEK: '7d',
  LAST_WEEK_SHORT: '1w',
  LAST_MONTH: '30d',
  LAST_MONTH_SHORT: '1mo',
  LAST_90_DAYS: '90d',
  LAST_3_MONTHS: '3mo',
} as const
