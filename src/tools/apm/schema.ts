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
 * Schema for listing service definitions from Datadog Service Catalog
 * Uses the Service Definitions API (v2)
 */
export const ListServiceDefinitionsZodSchema = z.object({
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe('Number of services per page (1-100, default: 10)'),
  page_number: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Page number for pagination (0-indexed, default: 0)'),
  schema_version: z
    .string()
    .optional()
    .describe('Filter by schema version (e.g., "v2", "v2.1", "v2.2")'),
})

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
export type ListServiceDefinitionsArgs = z.infer<
  typeof ListServiceDefinitionsZodSchema
>
