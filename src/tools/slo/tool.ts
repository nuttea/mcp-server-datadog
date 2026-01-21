import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v1 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import {
  ListSLOsZodSchema,
  GetSLOZodSchema,
  GetSLOHistoryZodSchema,
} from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'

type SLOToolName = 'list_slos' | 'get_slo' | 'get_slo_history'
type SLOTool = ExtendedTool<SLOToolName>

export const SLO_TOOLS: SLOTool[] = [
  createToolSchema(
    ListSLOsZodSchema,
    'list_slos',
    'List Service Level Objectives (SLOs) from Datadog',
  ),
  createToolSchema(
    GetSLOZodSchema,
    'get_slo',
    'Get a specific SLO from Datadog',
  ),
  createToolSchema(
    GetSLOHistoryZodSchema,
    'get_slo_history',
    'Get SLO history and performance over time',
  ),
] as const

type SLOToolHandlers = ToolHandlers<SLOToolName>

export const createSLOToolHandlers = (
  apiInstance: v1.ServiceLevelObjectivesApi,
): SLOToolHandlers => ({
  list_slos: async (request) => {
    const { tags, query, limit } = parseWithWarnings(
      ListSLOsZodSchema,
      request.params.arguments,
      'list_slos',
    )

    const params: v1.ServiceLevelObjectivesApiListSLOsRequest = {
      tags: tags?.join(','),
      query,
      limit,
    }

    const response = await withRetry(() => apiInstance.listSLOs(params))

    if (!response.data) {
      throw new Error('No SLOs data returned')
    }

    // Format SLO data for output
    const slos = response.data.map((slo) => ({
      id: slo.id,
      name: slo.name,
      description: slo.description,
      type: slo.type,
      tags: slo.tags,
      thresholds: slo.thresholds,
      created_at: slo.createdAt,
      modified_at: slo.modifiedAt,
      creator: slo.creator,
      monitor_ids: slo.monitorIds,
      monitor_tags: slo.monitorTags,
      sli_specification: slo.sliSpecification,
      status: slo.overallStatus,
    }))

    return {
      content: [
        {
          type: 'text',
          text: `SLOs (${slos.length} total): ${JSON.stringify({ slos }, null, 2)}`,
        },
      ],
    }
  },

  get_slo: async (request) => {
    const parsed = parseWithWarnings(
      GetSLOZodSchema,
      request.params.arguments,
      'get_slo',
    )

    // Support both sloId and slo_id for compatibility
    const sloId = parsed.sloId || parsed.slo_id!

    const params: v1.ServiceLevelObjectivesApiGetSLORequest = {
      sloId,
      withConfiguredAlertIds: parsed.withConfiguredAlertIds,
    }

    const response = await withRetry(() => apiInstance.getSLO(params))

    if (!response.data) {
      throw new Error('No SLO data returned')
    }

    const slo = response.data

    return {
      content: [
        {
          type: 'text',
          text: `SLO Details: ${JSON.stringify(
            {
              id: slo.id,
              name: slo.name,
              description: slo.description,
              type: slo.type,
              tags: slo.tags,
              thresholds: slo.thresholds,
              overall_status: slo.overallStatus,
              error_budget_remaining: slo.errorBudgetRemaining,
              created_at: slo.createdAt,
              modified_at: slo.modifiedAt,
              creator: slo.creator,
              monitor_ids: slo.monitorIds,
              sli_value: slo.sliValue,
              configured_alert_ids: response.data?.configuredAlertIds,
            },
            null,
            2,
          )}`,
        },
      ],
    }
  },

  get_slo_history: async (request) => {
    const parsed = parseWithWarnings(
      GetSLOHistoryZodSchema,
      request.params.arguments,
      'get_slo_history',
    )

    // Support both sloId and slo_id for compatibility
    const sloId = parsed.sloId || parsed.slo_id!

    const params: v1.ServiceLevelObjectivesApiGetSLOHistoryRequest = {
      sloId,
      fromTs: parsed.from,
      toTs: parsed.to,
      target: parsed.target,
    }

    const response = await withRetry(() => apiInstance.getSLOHistory(params))

    if (!response.data) {
      throw new Error('No SLO history data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `SLO History: ${JSON.stringify(
            {
              slo_id: sloId,
              from_ts: from,
              to_ts: to,
              type: response.data.type,
              type_id: response.data.typeId,
              name: response.data.name,
              sli_value: response.data.sliValue,
              span_precision: response.data.spanPrecision,
              precision: response.data.precision,
              preview: response.data.preview,
              history: response.data.series,
              thresholds: response.data.thresholds,
              overall: response.data.overall,
              error_budget_remaining: response.data.errorBudgetRemaining,
            },
            null,
            2,
          )}`,
        },
      ],
    }
  },
})
