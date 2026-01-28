import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v2, v1 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import {
  GetServiceStatsRealtimeZodSchema,
  GetServiceStatsAggregatedZodSchema,
  GetServiceEndpointsZodSchema,
  GetOperationStatsZodSchema,
  ListServiceDefinitionsZodSchema,
} from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { parseTimeParam } from '../../utils/relative-time'

type APMToolName =
  | 'get_service_stats_realtime'
  | 'get_service_stats_aggregated'
  | 'get_service_endpoints'
  | 'get_operation_stats'
  | 'list_service_definitions'
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
    ListServiceDefinitionsZodSchema,
    'list_service_definitions',
    'List service definitions from Datadog Service Catalog (metadata, team ownership, schema version)',
  ),
] as const

type APMToolHandlers = ToolHandlers<APMToolName>

export const createAPMToolHandlers = (
  spansApi: v2.SpansApi,
  metricsApi: v1.MetricsApi,
  serviceDefApi: v2.ServiceDefinitionApi,
): APMToolHandlers => ({
  get_service_stats_realtime: async (request) => {
    const { service, from, to, env } = parseWithWarnings(
      GetServiceStatsRealtimeZodSchema,
      request.params.arguments,
      'get_service_stats_realtime',
    )

    // Convert time parameters to format accepted by Spans API and also keep timestamps for calculations
    // Spans API accepts: "now-7d", ISO strings, or we convert timestamps to ISO
    let fromFilter: string
    let toFilter: string
    let fromTimestamp: number
    let toTimestamp: number

    if (typeof from === 'string' && from.startsWith('now')) {
      // Pass relative time strings directly (e.g., "now-7d")
      fromFilter = from
      fromTimestamp =
        parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
    } else {
      // Convert Unix timestamp to ISO string
      fromTimestamp =
        parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
      fromFilter = new Date(fromTimestamp * 1000).toISOString()
    }

    if (typeof to === 'string' && to.startsWith('now')) {
      // Pass relative time strings directly (e.g., "now")
      toFilter = to
      toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)
    } else {
      // Convert Unix timestamp to ISO string
      toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)
      toFilter = new Date(toTimestamp * 1000).toISOString()
    }

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
                { aggregation: 'pc75', metric: '@duration' },
                { aggregation: 'pc95', metric: '@duration' },
                { aggregation: 'pc99', metric: '@duration' },
                { aggregation: 'max', metric: '@duration' },
              ],
              filter: {
                from: fromFilter,
                to: toFilter,
                query,
              },
            },
            type: 'aggregate_request',
          },
        },
      }),
    )

    // Debug: Log response structure
    console.error('DEBUG response:', JSON.stringify(response, null, 2))

    if (!response.data || response.data.length === 0) {
      throw new Error('No APM stats data returned')
    }

    // Calculate statistics from response
    // response.data is the array of buckets directly (not response.data.buckets)
    const buckets = response.data

    // Note: API returns 'compute' (plural) as a map of metric names to values
    const bucket = buckets[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compute = (bucket.attributes as any)?.compute || {}

    const totalRequests = compute.c0 || 0
    const timeRangeSeconds = toTimestamp - fromTimestamp

    const stats = {
      service,
      time_range: {
        from,
        to,
        duration_seconds: timeRangeSeconds,
      },
      request_stats: {
        total_requests: totalRequests,
        requests_per_second: totalRequests / timeRangeSeconds,
      },
      latency_stats_ns: {
        avg: compute.c1 || 0,
        p75: compute.c2 || 0,
        p95: compute.c3 || 0,
        p99: compute.c4 || 0,
        max: compute.c5 || 0,
      },
      latency_stats_ms: {
        avg_ms: (compute.c1 || 0) / 1_000_000,
        p75_ms: (compute.c2 || 0) / 1_000_000,
        p95_ms: (compute.c3 || 0) / 1_000_000,
        p99_ms: (compute.c4 || 0) / 1_000_000,
        max_ms: (compute.c5 || 0) / 1_000_000,
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

    // Convert time parameters to Unix timestamps (Metrics API requires numbers)
    const fromTimestamp =
      parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
    const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

    // Note: Pre-aggregated metrics trace.{service}.request.* only exist for some services
    // Try to query them, but fall back gracefully if not available
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
            from: fromTimestamp,
            to: toTimestamp,
            query,
          }),
        ).catch((error) => {
          // If metric doesn't exist, return empty result
          console.error(
            `[get_service_stats_aggregated] Metric query failed: ${error.message}`,
          )
          return { series: [] }
        }),
      ),
    )

    const hasData = results.some((r) => r.series && r.series.length > 0)

    const stats = {
      service,
      time_range: { from, to },
      request_rate: results[0]?.series?.[0]?.pointlist || [],
      error_rate: results[1]?.series?.[0]?.pointlist || [],
      avg_latency: results[2]?.series?.[0]?.pointlist || [],
      note: hasData
        ? undefined
        : 'Pre-aggregated metrics not available for this service. Use get_service_stats_realtime instead.',
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

    // Convert relative time strings to Unix timestamps
    const fromTimestamp =
      parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
    const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

    const envFilter = env ? ` env:${env}` : ''
    // Filter by type:web to get HTTP endpoints (matches Datadog UI behavior)
    const query = `service:${service}${envFilter} type:web`

    // Use listSpans API to get sample of web request spans
    // Filter by type:web to focus on HTTP endpoints like the UI does
    const response = await withRetry(() =>
      spansApi.listSpans({
        body: {
          data: {
            attributes: {
              filter: {
                from: new Date(fromTimestamp * 1000).toISOString(),
                to: new Date(toTimestamp * 1000).toISOString(),
                query,
              },
              sort: 'timestamp',
              page: {
                limit: 1000, // Get enough web request spans to capture endpoints
              },
            },
            type: 'search_request',
          },
        },
      }),
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = (response as any).data || []

    if (!responseData || responseData.length === 0) {
      throw new Error('No endpoints data returned')
    }

    // Group spans by resource_name and calculate stats
    const endpointMap = new Map<
      string,
      {
        durations: number[]
        errorCount: number
        successCount: number
      }
    >()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseData.forEach((span: any) => {
      // NOTE: SDK uses camelCase: resourceName, NOT resource_name
      const resource = String(span.attributes?.resourceName || 'unknown')
      const duration = Number(span.attributes?.custom?.duration || 0)
      const isError = span.attributes?.status === 'error'

      if (!endpointMap.has(resource)) {
        endpointMap.set(resource, {
          durations: [],
          errorCount: 0,
          successCount: 0,
        })
      }

      const stats = endpointMap.get(resource)!
      stats.durations.push(duration)
      if (isError) {
        stats.errorCount++
      } else {
        stats.successCount++
      }
    })

    // Calculate percentiles and convert to array
    const endpoints = Array.from(endpointMap.entries())
      .map(([resource, stats]) => {
        // Detect resource type and parse accordingly
        let method = 'UNKNOWN'
        let path = resource
        let resourceType = 'other'

        // Try to parse HTTP method from resource_name (e.g., "GET /api/products")
        const httpMatch = resource.match(
          /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/,
        )
        if (httpMatch) {
          method = httpMatch[1]
          path = httpMatch[2]
          resourceType = 'http'
        }
        // HTTP error codes (404, 500, etc.) - typically GET requests
        else if (/^\d{3}$/.test(resource)) {
          method = 'GET'
          path = resource
          resourceType = 'http_error'
        }
        // Paths starting with / are HTTP paths (GET by default unless specified)
        else if (resource.startsWith('/')) {
          method = 'GET'
          path = resource
          resourceType = 'http'
        }
        // Controller methods (e.g., "ImageController.getImage") - map to HTTP
        else if (resource.includes('Controller.')) {
          const methodName = resource.split('.')[1]
          if (methodName?.toLowerCase().startsWith('get')) {
            method = 'GET'
          } else if (methodName?.toLowerCase().startsWith('post')) {
            method = 'POST'
          } else if (methodName?.toLowerCase().startsWith('put')) {
            method = 'PUT'
          } else if (methodName?.toLowerCase().startsWith('delete')) {
            method = 'DELETE'
          } else {
            method = 'HTTP'
          }
          path = resource
          resourceType = 'http'
        }
        // Database operations
        else if (
          resource.includes('SELECT') ||
          resource.includes('INSERT') ||
          resource.includes('UPDATE') ||
          resource.includes('DELETE FROM')
        ) {
          method = 'SQL'
          path =
            resource.substring(0, 100) + (resource.length > 100 ? '...' : '')
          resourceType = 'database'
        } else if (
          resource === 'postgresql.query' ||
          resource.includes('.query')
        ) {
          method = 'DB'
          path = resource
          resourceType = 'database'
        }
        // Scheduled tasks
        else if (
          resource.includes('Schedul') ||
          resource.includes('.process') ||
          resource.includes('Trigger')
        ) {
          method = 'TASK'
          path = resource
          resourceType = 'scheduled_task'
        }
        // Everything else (internal methods)
        else {
          method = 'METHOD'
          path = resource
          resourceType = 'internal'
        }

        const totalRequests = stats.successCount + stats.errorCount

        // Calculate average and p95 latency
        stats.durations.sort((a, b) => a - b)
        const avgDuration =
          stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        const p95Index = Math.floor(stats.durations.length * 0.95)
        const p95Duration = stats.durations[p95Index] || stats.durations[0]

        return {
          resource,
          resource_type: resourceType,
          method,
          path,
          requests: totalRequests,
          errors: stats.errorCount,
          error_rate:
            totalRequests > 0 ? (stats.errorCount / totalRequests) * 100 : 0,
          avg_latency_ms: avgDuration / 1_000_000,
          p95_latency_ms: p95Duration / 1_000_000,
        }
      })
      .slice(0, limit || 100) // Apply limit

    // Sort by request count descending
    endpoints.sort((a, b) => b.requests - a.requests)

    // Group by resource type for better readability
    const byType = endpoints.reduce(
      (acc, endpoint) => {
        if (!acc[endpoint.resource_type]) {
          acc[endpoint.resource_type] = []
        }
        acc[endpoint.resource_type].push(endpoint)
        return acc
      },
      {} as Record<string, typeof endpoints>,
    )

    return {
      content: [
        {
          type: 'text',
          text: `Service Endpoints (${endpoints.length} found): ${JSON.stringify(
            {
              service,
              total_endpoints: endpoints.length,
              by_type: Object.keys(byType).reduce(
                (acc, type) => {
                  acc[type] = byType[type].length
                  return acc
                },
                {} as Record<string, number>,
              ),
              endpoints,
            },
            null,
            2,
          )}`,
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

    // Convert relative time strings to Unix timestamps
    const fromTimestamp =
      parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
    const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

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
                { aggregation: 'pc75', metric: '@duration' },
                { aggregation: 'pc95', metric: '@duration' },
                { aggregation: 'pc99', metric: '@duration' },
                { aggregation: 'max', metric: '@duration' },
              ],
              filter: {
                from: new Date(fromTimestamp * 1000).toISOString(),
                to: new Date(toTimestamp * 1000).toISOString(),
                query,
              },
            },
            type: 'aggregate_request',
          },
        },
      }),
    )

    if (!response.data || response.data.length === 0) {
      throw new Error('No operation stats data returned')
    }

    // response.data is the array of buckets directly
    const buckets = response.data

    const successBucket =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (buckets as any[]).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (b: any) => b.by?.error === 'false',
      ) || buckets[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorBucket = (buckets as any[]).find((b) => b.by?.error === 'true')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const successCompute = (successBucket?.attributes as any)?.compute || {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorCompute = (errorBucket?.attributes as any)?.compute || {}

    const successCount = successCompute.c0 || 0
    const errorCount = errorCompute.c0 || 0
    const total = successCount + errorCount
    const timeRangeSeconds = toTimestamp - fromTimestamp

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
        avg_ms: (successCompute.c1 || 0) / 1_000_000,
        p75_ms: (successCompute.c2 || 0) / 1_000_000,
        p95_ms: (successCompute.c3 || 0) / 1_000_000,
        p99_ms: (successCompute.c4 || 0) / 1_000_000,
        max_ms: (successCompute.c5 || 0) / 1_000_000,
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
   * List service definitions from Datadog Service Catalog
   * Returns metadata, team ownership, languages, etc.
   */
  list_service_definitions: async (request) => {
    const params = parseWithWarnings(
      ListServiceDefinitionsZodSchema,
      request.params.arguments,
      'list_service_definitions',
    )

    // Use ServiceDefinitionApi to list service definitions
    const requestParams: v2.ServiceDefinitionApiListServiceDefinitionsRequest =
      {
        pageSize: params.page_size,
        pageNumber: params.page_number,
      }

    if (params.schema_version) {
      requestParams.schemaVersion =
        params.schema_version as v2.ServiceDefinitionSchemaVersions
    }

    const response = await withRetry(() =>
      serviceDefApi.listServiceDefinitions(requestParams),
    )

    // Extract service information from response
    const services =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.data?.map((service: any) => {
        const schema = service.attributes?.schema || {}
        return {
          service: schema.ddService || schema['dd-service'] || 'unknown',
          schema_version:
            schema.schemaVersion || schema['schema-version'] || 'v2',
          team: schema.team || null,
          application: schema.application || null,
          description: schema.description || null,
          tier: schema.tier || null,
          lifecycle: schema.lifecycle || null,
          languages: schema.languages || [],
          type: schema.type || null,
          contacts: schema.contacts || [],
          links: schema.links || [],
          tags: schema.tags || [],
          integrations: schema.integrations || {},
          last_modified: service.attributes?.meta?.lastModifiedTime || null,
        }
      }) || []

    const totalServices = services.length
    const totalPages = Math.ceil(totalServices / params.page_size)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: totalServices,
              page: params.page_number,
              page_size: params.page_size,
              total_pages: totalPages,
              services,
            },
            null,
            2,
          ),
        },
      ],
    }
  },
})
