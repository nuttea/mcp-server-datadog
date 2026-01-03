import { z } from 'zod'

export const GetLogsZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .default('*')
      .describe('Datadog logs query string (max 10000 chars, default: *)'),
    from: z
      .number()
      .int()
      .min(0)
      .describe(
        'Start time in epoch seconds (defaults to 1 hour ago if not provided)',
      ),
    to: z
      .number()
      .int()
      .min(0)
      .describe('End time in epoch seconds (defaults to now if not provided)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe('Maximum number of logs to return (1-1000, default: 100)'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })

/**
 * Schema for retrieving all unique service names from logs.
 * Defines parameters for querying logs within a time window.
 *
 * @param query - Optional. Additional query filter for log search. Defaults to "*" (all logs)
 * @param from - Required. Start time in epoch seconds
 * @param to - Required. End time in epoch seconds
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
    from: z
      .number()
      .int()
      .min(0)
      .describe(
        'Start time in epoch seconds (defaults to 1 hour ago if not provided)',
      ),
    to: z
      .number()
      .int()
      .min(0)
      .describe('End time in epoch seconds (defaults to now if not provided)'),
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
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })
