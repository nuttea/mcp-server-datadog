import { v2 } from '@datadog/datadog-api-client'
import { log } from '../../utils/helper'
import { createToolSchema } from '../../utils/tool'
import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { GetAllServicesZodSchema, GetLogsZodSchema } from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { parseTimeframe } from '../../utils/timeframe'

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
): LogsToolHandlers => ({
  get_logs: async (request) => {
    const { query, from, to, limit } = parseWithWarnings(
      GetLogsZodSchema,
      request.params.arguments,
      'get_logs',
    )

    const configuredStorageTier = getConfiguredStorageTier()
    const filter: {
      query: string
      from: string
      to: string
      storageTier?: string
    } = {
      query,
      // `from` and `to` are in epoch seconds, but the Datadog API expects milliseconds
      from: `${from * 1000}`,
      to: `${to * 1000}`,
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
      // Use provided from/to or defaults from validation
      from = params.from!
      to = params.to!
    }

    const configuredStorageTier = getConfiguredStorageTier()
    const filter: {
      query: string
      from: string
      to: string
      storageTier?: string
    } = {
      query: params.query,
      // `from` and `to` are in epoch seconds, but the Datadog API expects milliseconds
      from: `${from * 1000}`,
      to: `${to * 1000}`,
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
            limit: params.limit,
          },
          sort: '-timestamp',
        },
      }),
    )

    if (response.data == null) {
      throw new Error('No logs data returned')
    }

    // Strategy: Combine Service Catalog + Logs for comprehensive discovery

    // 1. Get services from Service Catalog (authoritative source)
    const servicesFromCatalog = new Set<string>()
    try {
      const catalogResponse = await withRetry(() =>
        serviceDefApi.listServiceDefinitions({ pageSize: 100 }),
      )

      if (catalogResponse.data) {
        for (const service of catalogResponse.data) {
          if (service.attributes?.schema?.ddService) {
            servicesFromCatalog.add(service.attributes.schema.ddService)
          }
        }
      }
    } catch {
      // Service Catalog not available, will use logs only
    }

    // 2. Get services from logs (may include services not in catalog)
    const servicesFromLogs = new Set<string>()
    for (const log of response.data) {
      if (log.attributes && log.attributes.service) {
        servicesFromLogs.add(log.attributes.service)
      }
    }

    // 3. Combine both sources
    const allServices = new Set([...servicesFromCatalog, ...servicesFromLogs])

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
