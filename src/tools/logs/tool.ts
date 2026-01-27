import { v2, v1, client } from '@datadog/datadog-api-client'
import { log } from '../../utils/helper'
import { createToolSchema } from '../../utils/tool'
import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { GetAllServicesZodSchema, GetLogsZodSchema } from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { parseTimeframe } from '../../utils/timeframe'
import { parseTimeParam } from '../../utils/relative-time'

type LogsToolName = 'get_logs' | 'get_all_services'
type LogsTool = ExtendedTool<LogsToolName>

// Storage tier configuration from environment
const SUPPORTED_STORAGE_TIERS = ['indexes', 'online-archives', 'flex'] as const
type StorageTier = (typeof SUPPORTED_STORAGE_TIERS)[number]

function getConfiguredStorageTier(): StorageTier | undefined {
  const value = process.env.DATADOG_STORAGE_TIER
  if (!value) {
    return undefined
  }

  const normalized = value.toLowerCase()
  if (!SUPPORTED_STORAGE_TIERS.includes(normalized as StorageTier)) {
    log(
      'error',
      `Invalid DATADOG_STORAGE_TIER="${value}". Supported values: ${SUPPORTED_STORAGE_TIERS.join(
        ', ',
      )}`,
    )
    return undefined
  }

  return normalized as StorageTier
}

export const LOGS_TOOLS: LogsTool[] = [
  createToolSchema(
    GetLogsZodSchema,
    'get_logs',
    'Search and retrieve logs from Datadog',
  ),
  createToolSchema(
    GetAllServicesZodSchema,
    'get_all_services',
    'Extract all unique service names from logs',
  ),
] as const

type LogsToolHandlers = ToolHandlers<LogsToolName>

export const createLogsToolHandlers = (
  apiInstance: v2.LogsApi,
  serviceDefApi: v2.ServiceDefinitionApi,
  metricsApi?: v1.MetricsApi,
  spansApi?: v2.SpansApi,
  configuration?: client.Configuration,
): LogsToolHandlers => ({
  get_logs: async (request) => {
    const { query, from, to, limit } = parseWithWarnings(
      GetLogsZodSchema,
      request.params.arguments,
      'get_logs',
    )

    // Convert time parameters to Unix timestamps in seconds
    const fromTimestamp =
      parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
    const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

    const configuredStorageTier = getConfiguredStorageTier()
    const filter: {
      query: string
      from: string
      to: string
      storageTier?: string
    } = {
      query,
      // Datadog API expects milliseconds
      from: `${fromTimestamp * 1000}`,
      to: `${toTimestamp * 1000}`,
    }

    // Add storageTier to filter if configured
    if (configuredStorageTier) {
      filter.storageTier = configuredStorageTier
    }

    const response = await withRetry(() =>
      apiInstance.listLogs({
        body: {
          filter,
          page: {
            limit,
          },
          sort: '-timestamp',
        },
      }),
    )

    if (response.data == null) {
      throw new Error('No logs data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Logs data: ${JSON.stringify(response.data)}`,
        },
      ],
    }
  },

  get_all_services: async (request) => {
    const params = parseWithWarnings(
      GetAllServicesZodSchema,
      request.params.arguments,
      'get_all_services',
    )

    // Handle timeframe conversion
    let from: number
    let to: number

    if (params.timeframe) {
      // Convert human-friendly timeframe to epoch timestamps
      const range = parseTimeframe(params.timeframe)
      from = range.from
      to = range.to
      log(
        'info',
        `[get_all_services] Using timeframe: ${params.timeframe} (${new Date(from * 1000).toISOString()} to ${new Date(to * 1000).toISOString()})`,
      )
    } else {
      // Use provided from/to or defaults from validation (7 days for service discovery)
      from =
        parseTimeParam(params.from) ?? Math.floor(Date.now() / 1000) - 604800 // 7 days
      to = parseTimeParam(params.to) ?? Math.floor(Date.now() / 1000)
      log(
        'info',
        `[get_all_services] Using time range: last 7 days (${new Date(from * 1000).toISOString()} to ${new Date(to * 1000).toISOString()})`,
      )
    }

    // Strategy: Use APM metrics (like Datadog UI) + Service Catalog
    // Skip logs query as it's slow and incomplete

    // 1. Get services from Service Catalog (authoritative source)
    const servicesFromCatalog = new Set<string>()
    try {
      const catalogResponse = await withRetry(() =>
        serviceDefApi.listServiceDefinitions({ pageSize: 100 }),
      )

      if (catalogResponse.data) {
        for (const service of catalogResponse.data) {
          // Handle both ddService and dd-service field names
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const schema = service.attributes?.schema as any
          const serviceName = schema?.ddService || schema?.['dd-service']
          if (serviceName) {
            servicesFromCatalog.add(serviceName)
          }
        }
      }
      log(
        'info',
        `[get_all_services] Found ${servicesFromCatalog.size} services from Service Catalog`,
      )
    } catch {
      // Service Catalog not available
      log('info', '[get_all_services] Service Catalog not available')
    }

    // 2. Get services from APM Services API (exact same endpoint as Datadog UI)
    const servicesFromAPM = new Set<string>()
    if (configuration) {
      try {
        // Use the APM Services API endpoint (same data as Datadog UI)
        // GET /api/v2/apm/services?filter[env]=*&filter[from]=xxx&filter[to]=xxx
        const baseUrl = `https://api.${process.env.DATADOG_SITE || 'datadoghq.com'}`
        const url = `${baseUrl}/api/v2/apm/services?filter%5Benv%5D=%2A&filter%5Bfrom%5D=${from}&filter%5Bto%5D=${to}&source=mcp&datastore=metrics`

        const response = await withRetry(async () => {
          // Get API keys from environment or configuration
          const apiKey =
            process.env.DATADOG_API_KEY ||
            (configuration.authMethods.apiKeyAuth as string)
          const appKey =
            process.env.DATADOG_APP_KEY ||
            (configuration.authMethods.appKeyAuth as string)

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'DD-API-KEY': apiKey,
              'DD-APPLICATION-KEY': appKey,
              'Content-Type': 'application/json',
            },
          })

          if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`HTTP ${res.status}: ${errorText}`)
          }

          return res.json()
        })

        // Response format: { data: { attributes: { services: [...] } } }
        const services = response?.data?.attributes?.services || []
        services.forEach((service: string) => servicesFromAPM.add(service))

        log(
          'info',
          `[get_all_services] Found ${servicesFromAPM.size} services from APM Services API`,
        )
      } catch (error) {
        // APM Services API not available, fallback to catalog
        log(
          'info',
          `[get_all_services] APM Services API error: ${error}, using catalog only`,
        )
      }
    } else {
      log(
        'info',
        '[get_all_services] Configuration not provided, using catalog only',
      )
    }

    // 3. Combine Service Catalog + APM (no logs as per user request)
    const allServices = new Set([...servicesFromCatalog, ...servicesFromAPM])
    log(
      'info',
      `[get_all_services] Total unique services: ${allServices.size} (Catalog: ${servicesFromCatalog.size}, APM: ${servicesFromAPM.size})`,
    )

    return {
      content: [
        {
          type: 'text',
          text: `Services: ${JSON.stringify(Array.from(allServices).sort())}`,
        },
      ],
    }
  },
})
