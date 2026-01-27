import { z } from 'zod'

export const GetLogsZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .default('*')
      .describe('Datadog logs query string (max 10000 chars, default: *)'),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time as Unix timestamp in seconds OR relative time string. Examples: 1737504000 or "now-1h" (defaults to 1 hour ago)',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time as Unix timestamp in seconds OR relative time string. Examples: 1737590400 or "now" (defaults to now)',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe('Maximum number of logs to return (1-1000, default: 100)'),
  })
  .refine(
    (data) => {
      // Only validate time order if both are numbers
      if (typeof data.to === 'number' && typeof data.from === 'number') {
        return data.to > data.from
      }
      return true
    },
    {
      message: 'End time must be after start time',
    },
  )
  .refine(
    (data) => {
      // Only validate range if both are numbers
      if (typeof data.to === 'number' && typeof data.from === 'number') {
        return data.to - data.from <= 86400 * 90
      }
      return true
    },
    {
      message: 'Time range cannot exceed 90 days',
    },
  )

/**
 * Schema for retrieving all unique service names from logs.
 * Defines parameters for querying logs within a time window.
 *
 * @param query - Optional. Additional query filter for log search. Defaults to "*" (all logs)
 * @param timeframe - Optional. Human-friendly time range (e.g., "1h", "24h", "7d", "1w", "30d")
 * @param from - Optional. Start time in epoch seconds (defaults to 1 hour ago if not provided)
 * @param to - Optional. End time in epoch seconds (defaults to now if not provided)
 * @param limit - Optional. Maximum number of logs to search through. Default is 1000.
 */
export const GetAllServicesZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .default('*')
      .describe(
        'Optional query filter for log search (max 10000 chars, default: *)',
      ),
    timeframe: z
      .string()
      .optional()
      .describe(
        'Human-friendly time range (e.g., "1h", "6h", "24h", "7d", "1w", "30d"). Overrides from/to if provided.',
      ),
    from: z
      .union([z.number().int().min(0), z.string()])
      .optional()
      .describe(
        'Start time as Unix timestamp in seconds OR relative time string (defaults to 7 days ago for service discovery)',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .optional()
      .describe(
        'End time as Unix timestamp in seconds OR relative time string (defaults to now)',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(1000)
      .describe(
        'Maximum number of logs to search through (1-1000, default: 1000)',
      ),
  })
  .refine(
    (data) => {
      // Skip validation if timeframe is provided (will be converted)
      if (data.timeframe) return true
      // If from/to provided, validate them
      if (data.from !== undefined && data.to !== undefined) {
        return data.to > data.from
      }
      return true
    },
    {
      message: 'End time must be after start time',
    },
  )
  .refine(
    (data) => {
      // Skip validation if timeframe is provided
      if (data.timeframe) return true
      // If from/to provided, validate range
      if (data.from !== undefined && data.to !== undefined) {
        return data.to - data.from <= 86400 * 90
      }
      return true
    },
    {
      message: 'Time range cannot exceed 90 days',
    },
  )
