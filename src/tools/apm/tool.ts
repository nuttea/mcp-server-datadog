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

    // Convert relative time strings to Unix timestamps
    const fromTimestamp =
      parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
    const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

    const envFilter = env ? ` env:${env}` : ''
    const query = `service:${service}${envFilter}`

    // Use listSpans API to get sample of spans and extract unique resource names
    // This is a fallback approach when aggregateSpans groupBy doesn't work
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
                limit: 1000, // Get enough spans to capture most endpoints
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

    // Debug: Log first span to see structure
    if (responseData.length > 0) {
      console.error(
        'DEBUG first span:',
        JSON.stringify(responseData[0], null, 2).substring(0, 500),
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseData.forEach((span: any) => {
      const resource = String(span.attributes?.resource_name || 'unknown')
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

    console.error(
      `DEBUG: Found ${endpointMap.size} unique resource names`,
      Array.from(endpointMap.keys()).slice(0, 10),
    )

    // Calculate percentiles and convert to array
    const endpoints = Array.from(endpointMap.entries())
      .map(([resource, stats]) => {
        // Try to parse "METHOD /path" from resource_name
        const match = resource.match(
          /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/,
        )
        const method = match?.[1] || 'UNKNOWN'
        const path = match?.[2] || resource

        const totalRequests = stats.successCount + stats.errorCount

        // Calculate average and p95 latency
        stats.durations.sort((a, b) => a - b)
        const avgDuration =
          stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        const p95Index = Math.floor(stats.durations.length * 0.95)
        const p95Duration = stats.durations[p95Index] || stats.durations[0]

        return {
          resource,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const successBucket =
      (buckets as any[]).find((b) => b.by?.error === 'false') || buckets[0]
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
