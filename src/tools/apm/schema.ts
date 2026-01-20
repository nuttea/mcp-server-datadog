import { z } from 'zod'

/**
 * Schema for getting real-time service statistics using Spans API
 * Provides request rate, error rate, and latency percentiles
 */
export const GetServiceStatsRealtimeZodSchema = z
  .object({
    service: z.string().max(255).describe('Service name (max 255 chars)'),
    from: z
      .number()
      .int()
      .min(0)
      .describe('Start time in epoch seconds (defaults to 1 hour ago)'),
    to: z
      .number()
      .int()
      .min(0)
      .describe('End time in epoch seconds (defaults to now)'),
    env: z
      .string()
      .max(100)
      .optional()
      .describe('Environment filter (e.g., production, staging)'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })

/**
 * Schema for getting aggregated service statistics using Metrics API
 * Faster queries using pre-aggregated APM metrics
 */
export const GetServiceStatsAggregatedZodSchema = z
  .object({
    service: z.string().max(255).describe('Service name'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
    env: z.string().max(100).optional().describe('Environment filter'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })

/**
 * Schema for discovering service endpoints (API paths and methods)
 */
export const GetServiceEndpointsZodSchema = z
  .object({
    service: z.string().max(255).describe('Service name'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
    env: z.string().max(100).optional().describe('Environment filter'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe('Maximum number of endpoints to return (1-1000, default: 100)'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })

/**
 * Schema for getting statistics for a specific operation/endpoint
 */
export const GetOperationStatsZodSchema = z
  .object({
    service: z.string().max(255).describe('Service name'),
    operation: z
      .string()
      .max(255)
      .describe('Operation/resource name (e.g., GET /api/products)'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
    env: z.string().max(100).optional().describe('Environment filter'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })

/**
 * Schema for discovering all APM services
 * Queries the spans API to find all services sending traces
 */
export const GetAllAPMServicesZodSchema = z
  .object({
    timeframe: z
      .string()
      .optional()
      .describe(
        'Human-friendly time range (e.g., "1h", "6h", "24h", "7d", "1w", "30d"). Overrides from/to if provided.',
      ),
    from: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Start time in epoch seconds (defaults to 1 hour ago)'),
    to: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('End time in epoch seconds (defaults to now)'),
    env: z
      .string()
      .max(100)
      .optional()
      .describe('Environment filter (e.g., prod, dev, staging)'),
  })
  .refine(
    (data) => {
      if (data.timeframe) return true
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
      if (data.timeframe) return true
      if (data.from !== undefined && data.to !== undefined) {
        return data.to - data.from <= 86400 * 90
      }
      return true
    },
    {
      message: 'Time range cannot exceed 90 days',
    },
  )

export type GetServiceStatsRealtimeArgs = z.infer<
  typeof GetServiceStatsRealtimeZodSchema
>
export type GetServiceStatsAggregatedArgs = z.infer<
  typeof GetServiceStatsAggregatedZodSchema
>
export type GetServiceEndpointsArgs = z.infer<
  typeof GetServiceEndpointsZodSchema
>
export type GetOperationStatsArgs = z.infer<typeof GetOperationStatsZodSchema>
export type GetAllAPMServicesArgs = z.infer<typeof GetAllAPMServicesZodSchema>
