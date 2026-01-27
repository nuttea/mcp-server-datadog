import { z } from 'zod'

/**
 * Schema for getting real-time service statistics using Spans API
 * Provides request rate, error rate, and latency percentiles (p75, p95, p99)
 * Uses live span data for most accurate, up-to-date statistics
 */
export const GetServiceStatsRealtimeZodSchema = z
  .object({
    service: z
      .string()
      .max(255)
      .describe(
        'Service name to query APM statistics for. Use get_all_services to discover available services. Examples: "agent-api", "web-frontend", "database-service"',
      ),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time. Formats: Unix seconds (1737504000), relative ("now-7d", "now-1h"), or ISO-8601 ("2026-01-27T00:00:00Z"). Default: 1 hour ago',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time. Formats: Unix seconds (1737590400), relative ("now"), or ISO-8601. Default: now. For service discovery, use 7-day window',
      ),
    env: z
      .string()
      .max(100)
      .optional()
      .describe(
        'Filter by environment tag (e.g., "prod", "dev", "uat", "staging"). Optional - queries all environments if omitted',
      ),
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

/**
 * Schema for getting aggregated service statistics using Metrics API
 * Faster queries using pre-aggregated APM metrics (trace.{service}.request.*)
 * Note: Pre-aggregated metrics may not exist for all services. Use get_service_stats_realtime as fallback
 */
export const GetServiceStatsAggregatedZodSchema = z
  .object({
    service: z
      .string()
      .max(255)
      .describe(
        'Service name. Pre-aggregated metrics (trace.{service}.request.hits) only exist for some services. Returns empty with helpful note if unavailable',
      ),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time. Formats: Unix seconds, relative ("now-7d"), or ISO-8601. Default: 1 hour ago',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time. Formats: Unix seconds, relative ("now"), or ISO-8601. Default: now',
      ),
    env: z
      .string()
      .max(100)
      .optional()
      .describe(
        'Environment filter. Note: Use comma-separated for metrics queries (e.g., "env:prod")',
      ),
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

/**
 * Schema for discovering service endpoints (HTTP routes, database operations, scheduled tasks)
 * Filters by type:web to focus on HTTP endpoints by default
 * Returns categorized endpoints: http, http_error, database, scheduled_task, internal
 */
export const GetServiceEndpointsZodSchema = z
  .object({
    service: z
      .string()
      .max(255)
      .describe(
        'Service name to discover endpoints for. For web services, discovers HTTP routes (GET /api/..., POST /v2/...). For backend services, discovers DB operations and tasks',
      ),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time. Use 7-day window for comprehensive endpoint discovery. Formats: Unix seconds, relative ("now-7d"), or ISO-8601',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time. Formats: Unix seconds, relative ("now"), or ISO-8601. Default: now',
      ),
    env: z
      .string()
      .max(100)
      .optional()
      .describe(
        'Filter by environment (e.g., "prod", "uat"). Recommended for services deployed in multiple environments',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe(
        'Maximum number of endpoints to return (1-1000, default: 100). Sorted by request count descending',
      ),
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

/**
 * Schema for getting statistics for a specific operation/endpoint
 * Provides detailed performance metrics for a single resource/operation
 * Use get_service_endpoints first to discover available operations
 */
export const GetOperationStatsZodSchema = z
  .object({
    service: z
      .string()
      .max(255)
      .describe('Service name that owns this operation'),
    operation: z
      .string()
      .max(255)
      .describe(
        'Operation/resource name from get_service_endpoints. Examples: "GET /api/products", "POST /v2/services/{serviceName}/{methodName}", "postgresql.query"',
      ),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time. Formats: Unix seconds, relative ("now-7d"), or ISO-8601',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time. Formats: Unix seconds, relative ("now"), or ISO-8601',
      ),
    env: z
      .string()
      .max(100)
      .optional()
      .describe(
        'Filter by environment if operation exists in multiple environments',
      ),
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

/**
 * Schema for listing service definitions from Datadog Service Catalog
 * Returns services with metadata (team ownership, tier, links, contacts)
 * NOTE: This returns only services registered in Service Catalog with metadata
 * For discovering ALL APM services (with or without catalog entries), use get_all_services instead
 */
export const ListServiceDefinitionsZodSchema = z.object({
  timeframe: z
    .string()
    .optional()
    .default('30d')
    .describe(
      'Time range for service discovery. Default: "30d". Supports: 1h, 24h, 7d, 1w, 30d, 90d. Longer timeframes discover more services',
    ),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe(
      'Services per page for pagination (1-100, default: 10). Use higher values to get all services in one call',
    ),
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
    .describe(
      'Filter by Service Catalog schema version (e.g., "v2", "v2.1", "v2.2"). Omit to get all versions',
    ),
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
