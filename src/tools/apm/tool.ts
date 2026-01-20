import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v2, v1 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import {
  GetServiceStatsRealtimeZodSchema,
  GetServiceStatsAggregatedZodSchema,
  GetServiceEndpointsZodSchema,
  GetOperationStatsZodSchema,
  GetAllAPMServicesZodSchema,
} from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { parseTimeframe } from '../../utils/timeframe'
import { log } from '../../utils/helper'

type APMToolName =
  | 'get_service_stats_realtime'
  | 'get_service_stats_aggregated'
  | 'get_service_endpoints'
  | 'get_operation_stats'
  | 'get_all_apm_services'
type APMTool = ExtendedTool<APMToolName>

export const APM_TOOLS: APMTool[] = [
  createToolSchema(
    GetServiceStatsRealtimeZodSchema,
    'get_service_stats_realtime',
    'Get real-time APM service statistics (request rate, error rate, latency percentiles) using Spans API',
  ),
  createToolSchema(
    GetServiceStatsAggregatedZodSchema,
    'get_service_stats_aggregated',
    'Get aggregated APM service statistics using pre-aggregated metrics (faster)',
  ),
  createToolSchema(
    GetServiceEndpointsZodSchema,
    'get_service_endpoints',
    'Discover service API endpoints with HTTP methods and request statistics',
  ),
  createToolSchema(
    GetOperationStatsZodSchema,
    'get_operation_stats',
    'Get statistics for a specific operation/endpoint',
  ),
  createToolSchema(
    GetAllAPMServicesZodSchema,
    'get_all_apm_services',
    'Discover all APM services sending traces (with optional env filter and timeframe support)',
  ),
] as const

type APMToolHandlers = ToolHandlers<APMToolName>

export const createAPMToolHandlers = (
  spansApi: v2.SpansApi,
  metricsApi: v1.MetricsApi,
): APMToolHandlers => ({
  get_service_stats_realtime: async (request) => {
    const { service, from, to, env } = parseWithWarnings(
      GetServiceStatsRealtimeZodSchema,
      request.params.arguments,
      'get_service_stats_realtime',
    )

    const envFilter = env ? ` env:${env}` : ''
    const query = `service:${service}${envFilter}`

    // Get aggregated statistics using Spans API
    const response = await withRetry(() =>
      spansApi.aggregateSpans({
        body: {
          data: {
            attributes: {
              compute: [
                { aggregation: 'count', metric: '@duration' },
                { aggregation: 'avg', metric: '@duration' },
                { aggregation: 'pc50', metric: '@duration' },
                { aggregation: 'pc75', metric: '@duration' },
                { aggregation: 'pc95', metric: '@duration' },
                { aggregation: 'pc99', metric: '@duration' },
                { aggregation: 'max', metric: '@duration' },
              ],
              filter: {
                from: new Date(from * 1000).toISOString(),
                to: new Date(to * 1000).toISOString(),
                query,
              },
              groupBy: [{ facet: 'error', limit: 10 }],
            },
            type: 'aggregate_request',
          },
        },
      }),
    )

    if (!response.data || !response.data.buckets) {
      throw new Error('No APM stats data returned')
    }

    // Calculate statistics from response
    const buckets = response.data.buckets
    const totalRequests =
      buckets.find((b) => b.by?.error === 'false')?.computes?.c0 || 0
    const totalErrors =
      buckets.find((b) => b.by?.error === 'true')?.computes?.c0 || 0
    const total = totalRequests + totalErrors
    const timeRangeSeconds = to - from

    // Get latency stats (from non-error bucket)
    const latencyBucket =
      buckets.find((b) => b.by?.error === 'false') || buckets[0]
    const computes = latencyBucket?.computes || {}

    const stats = {
      service,
      time_range: {
        from,
        to,
        duration_seconds: timeRangeSeconds,
      },
      request_stats: {
        total_requests: total,
        requests_per_second: total / timeRangeSeconds,
        successful_requests: totalRequests,
        total_errors: totalErrors,
        error_rate_per_second: totalErrors / timeRangeSeconds,
        error_percentage: total > 0 ? (totalErrors / total) * 100 : 0,
      },
      latency_stats_ns: {
        avg: computes.c1 || 0,
        p50: computes.c2 || 0,
        p75: computes.c3 || 0,
        p95: computes.c4 || 0,
        p99: computes.c5 || 0,
        max: computes.c6 || 0,
      },
      latency_stats_ms: {
        avg_ms: (computes.c1 || 0) / 1_000_000,
        p50_ms: (computes.c2 || 0) / 1_000_000,
        p75_ms: (computes.c3 || 0) / 1_000_000,
        p95_ms: (computes.c4 || 0) / 1_000_000,
        p99_ms: (computes.c5 || 0) / 1_000_000,
        max_ms: (computes.c6 || 0) / 1_000_000,
      },
    }

    return {
      content: [
        {
          type: 'text',
          text: `Service Statistics (Real-time): ${JSON.stringify(stats, null, 2)}`,
        },
      ],
    }
  },

  get_service_stats_aggregated: async (request) => {
    const { service, from, to, env } = parseWithWarnings(
      GetServiceStatsAggregatedZodSchema,
      request.params.arguments,
      'get_service_stats_aggregated',
    )

    const envFilter = env ? `,env:${env}` : ''

    // Query pre-aggregated APM metrics
    const queries = [
      `sum:trace.${service}.request.hits{*${envFilter}}.as_rate()`,
      `sum:trace.${service}.request.errors{*${envFilter}}.as_rate()`,
      `avg:trace.${service}.request.duration{*${envFilter}}`,
    ]

    const results = await Promise.all(
      queries.map((query) =>
        withRetry(() =>
          metricsApi.queryMetrics({
            from,
            to,
            query,
          }),
        ),
      ),
    )

    const stats = {
      service,
      time_range: { from, to },
      request_rate: results[0]?.series?.[0]?.pointlist || [],
      error_rate: results[1]?.series?.[0]?.pointlist || [],
      avg_latency: results[2]?.series?.[0]?.pointlist || [],
    }

    return {
      content: [
        {
          type: 'text',
          text: `Service Statistics (Aggregated): ${JSON.stringify(stats, null, 2)}`,
        },
      ],
    }
  },

  get_service_endpoints: async (request) => {
    const { service, from, to, env, limit } = parseWithWarnings(
      GetServiceEndpointsZodSchema,
      request.params.arguments,
      'get_service_endpoints',
    )

    const envFilter = env ? ` env:${env}` : ''
    const query = `service:${service}${envFilter}`

    // Get endpoints by grouping spans by resource_name
    const response = await withRetry(() =>
      spansApi.aggregateSpans({
        body: {
          data: {
            attributes: {
              compute: [
                { aggregation: 'count', metric: '@duration' },
                { aggregation: 'avg', metric: '@duration' },
                { aggregation: 'pc95', metric: '@duration' },
              ],
              filter: {
                from: new Date(from * 1000).toISOString(),
                to: new Date(to * 1000).toISOString(),
                query,
              },
              groupBy: [
                { facet: 'resource_name', limit: limit || 100 },
                { facet: 'error', limit: 2 },
              ],
            },
            type: 'aggregate_request',
          },
        },
      }),
    )

    if (!response.data || !response.data.buckets) {
      throw new Error('No endpoints data returned')
    }

    // Group by resource_name and aggregate error stats
    const endpointMap = new Map<
      string,
      {
        requests: number
        errors: number
        avg_latency_ms: number
        p95_latency_ms: number
      }
    >()

    response.data.buckets.forEach((bucket) => {
      const resource = String(bucket.by?.resource_name || 'unknown')
      const isError = bucket.by?.error === 'true'
      const count = bucket.computes?.c0 || 0
      const avgDuration = bucket.computes?.c1 || 0
      const p95Duration = bucket.computes?.c2 || 0

      if (!endpointMap.has(resource)) {
        endpointMap.set(resource, {
          requests: 0,
          errors: 0,
          avg_latency_ms: 0,
          p95_latency_ms: 0,
        })
      }

      const stats = endpointMap.get(resource)!
      if (isError) {
        stats.errors += count
      } else {
        stats.requests += count
        stats.avg_latency_ms = avgDuration / 1_000_000
        stats.p95_latency_ms = p95Duration / 1_000_000
      }
    })

    // Convert to array and parse HTTP method from resource name
    const endpoints = Array.from(endpointMap.entries()).map(
      ([resource, stats]) => {
        // Try to parse "METHOD /path" from resource_name
        const match = resource.match(
          /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/,
        )
        const method = match?.[1] || 'UNKNOWN'
        const path = match?.[2] || resource

        const totalRequests = stats.requests + stats.errors

        return {
          resource,
          method,
          path,
          requests: totalRequests,
          errors: stats.errors,
          error_rate:
            totalRequests > 0 ? (stats.errors / totalRequests) * 100 : 0,
          avg_latency_ms: stats.avg_latency_ms,
          p95_latency_ms: stats.p95_latency_ms,
        }
      },
    )

    // Sort by request count descending
    endpoints.sort((a, b) => b.requests - a.requests)

    return {
      content: [
        {
          type: 'text',
          text: `Service Endpoints (${endpoints.length} found): ${JSON.stringify({ service, endpoints }, null, 2)}`,
        },
      ],
    }
  },

  get_operation_stats: async (request) => {
    const { service, operation, from, to, env } = parseWithWarnings(
      GetOperationStatsZodSchema,
      request.params.arguments,
      'get_operation_stats',
    )

    const envFilter = env ? ` env:${env}` : ''
    const query = `service:${service} resource_name:"${operation}"${envFilter}`

    // Get stats for specific operation
    const response = await withRetry(() =>
      spansApi.aggregateSpans({
        body: {
          data: {
            attributes: {
              compute: [
                { aggregation: 'count', metric: '@duration' },
                { aggregation: 'avg', metric: '@duration' },
                { aggregation: 'pc50', metric: '@duration' },
                { aggregation: 'pc75', metric: '@duration' },
                { aggregation: 'pc95', metric: '@duration' },
                { aggregation: 'pc99', metric: '@duration' },
                { aggregation: 'max', metric: '@duration' },
              ],
              filter: {
                from: new Date(from * 1000).toISOString(),
                to: new Date(to * 1000).toISOString(),
                query,
              },
              groupBy: [{ facet: 'error', limit: 10 }],
            },
            type: 'aggregate_request',
          },
        },
      }),
    )

    if (!response.data || !response.data.buckets) {
      throw new Error('No operation stats data returned')
    }

    const buckets = response.data.buckets
    const successBucket =
      buckets.find((b) => b.by?.error === 'false') || buckets[0]
    const errorBucket = buckets.find((b) => b.by?.error === 'true')

    const successCount = successBucket?.computes?.c0 || 0
    const errorCount = errorBucket?.computes?.c0 || 0
    const total = successCount + errorCount
    const timeRangeSeconds = to - from

    const computes = successBucket?.computes || {}

    const stats = {
      service,
      operation,
      time_range: {
        from,
        to,
        duration_seconds: timeRangeSeconds,
      },
      request_stats: {
        total_requests: total,
        requests_per_second: total / timeRangeSeconds,
        successful_requests: successCount,
        total_errors: errorCount,
        error_rate_per_second: errorCount / timeRangeSeconds,
        error_percentage: total > 0 ? (errorCount / total) * 100 : 0,
      },
      latency_stats_ms: {
        avg_ms: (computes.c1 || 0) / 1_000_000,
        p50_ms: (computes.c2 || 0) / 1_000_000,
        p75_ms: (computes.c3 || 0) / 1_000_000,
        p95_ms: (computes.c4 || 0) / 1_000_000,
        p99_ms: (computes.c5 || 0) / 1_000_000,
        max_ms: (computes.c6 || 0) / 1_000_000,
      },
    }

    return {
      content: [
        {
          type: 'text',
          text: `Operation Statistics: ${JSON.stringify(stats, null, 2)}`,
        },
      ],
    }
  },

  /**
   * Get all APM services
   * Discovers unique services from APM traces
   */
  get_all_apm_services: async (request) => {
    const params = parseWithWarnings(
      GetAllAPMServicesZodSchema,
      request.params.arguments,
      'get_all_apm_services',
    )

    // Handle timeframe conversion
    let from: number
    let to: number

    if (params.timeframe) {
      const range = parseTimeframe(params.timeframe)
      from = range.from
      to = range.to
      log(
        'info',
        `[get_all_apm_services] Using timeframe: ${params.timeframe} (${new Date(from * 1000).toISOString()} to ${new Date(to * 1000).toISOString()})`,
      )
    } else {
      from = params.from!
      to = params.to!
    }

    // Query spans to discover services
    const query = params.env ? `env:${params.env}` : '*'

    const response = await withRetry(() =>
      spansApi.aggregateSpans({
        body: {
          data: {
            attributes: {
              compute: [
                {
                  aggregation: 'count',
                  type: 'total',
                },
              ],
              filter: {
                from: new Date(from * 1000).toISOString(),
                to: new Date(to * 1000).toISOString(),
                query,
              },
              groupBy: [
                {
                  facet: 'service',
                  limit: 1000,
                  sort: {
                    aggregation: 'count',
                    order: 'desc',
                    type: 'total',
                  },
                },
              ],
            },
            type: 'aggregate_request',
          },
        },
      }),
    )

    // Extract unique services
    const services: string[] = []
    if (response.data && Array.isArray(response.data)) {
      for (const bucket of response.data) {
        if (bucket.by?.service) {
          services.push(bucket.by.service)
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `APM Services (${services.length} total): ${JSON.stringify(services.sort())}`,
        },
      ],
    }
  },
})
