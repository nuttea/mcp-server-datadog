import { z } from 'zod'

/**
 * Schema for retrieving RUM events.
 * Defines parameters for querying RUM events within a time window.
 *
 * @param query - Datadog RUM query string
 * @param from - Start time in epoch seconds
 * @param to - End time in epoch seconds
 * @param limit - Maximum number of events to return (default: 100)
 */
export const GetRumEventsZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .default('')
      .describe('Datadog RUM query string (max 10000 chars)'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe('Maximum number of events to return (1-1000, default: 100)'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })

/**
 * Schema for retrieving RUM applications.
 * Returns a list of all RUM applications in the organization.
 */
export const GetRumApplicationsZodSchema = z.object({})

/**
 * Schema for retrieving unique user session counts.
 * Defines parameters for querying session counts within a time window.
 *
 * @param query - Optional. Additional query filter for RUM search. Defaults to "*" (all events)
 * @param from - Start time in epoch seconds
 * @param to - End time in epoch seconds
 * @param groupBy - Optional. Dimension to group results by (e.g., 'application.name')
 */
export const GetRumGroupedEventCountZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .default('*')
      .describe('Optional query filter for RUM search (max 10000 chars)'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
    groupBy: z
      .string()
      .max(255)
      .optional()
      .default('application.name')
      .describe(
        'Dimension to group results by (max 255 chars, default: application.name)',
      ),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })

/**
 * Schema for retrieving page performance metrics.
 * Defines parameters for querying performance metrics within a time window.
 *
 * @param query - Optional. Additional query filter for RUM search. Defaults to "*" (all events)
 * @param from - Start time in epoch seconds
 * @param to - End time in epoch seconds
 * @param metricNames - Array of metric names to retrieve (e.g., 'view.load_time', 'view.first_contentful_paint')
 */
export const GetRumPagePerformanceZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .default('*')
      .describe('Optional query filter for RUM search (max 10000 chars)'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
    metricNames: z
      .array(z.string().max(255))
      .default([
        'view.load_time',
        'view.first_contentful_paint',
        'view.largest_contentful_paint',
      ])
      .describe('Array of metric names to retrieve (each max 255 chars)'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })

/**
 * Schema for retrieving RUM page waterfall data.
 * Defines parameters for querying waterfall data within a time window.
 *
 * @param application - Application name or ID to filter events
 * @param sessionId - Session ID to filter events
 * @param from - Start time in epoch seconds
 * @param to - End time in epoch seconds
 */
export const GetRumPageWaterfallZodSchema = z.object({
  applicationName: z
    .string()
    .max(255)
    .describe('Application name to filter events (max 255 chars)'),
  sessionId: z
    .string()
    .max(255)
    .describe('Session ID to filter events (max 255 chars)'),
})
