import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v1 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import { QueryMetricsZodSchema } from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { parseTimeParam } from '../../utils/relative-time'

type MetricsToolName = 'query_metrics'
type MetricsTool = ExtendedTool<MetricsToolName>

export const METRICS_TOOLS: MetricsTool[] = [
  createToolSchema(
    QueryMetricsZodSchema,
    'query_metrics',
    'Query timeseries metrics from Datadog. Supports aggregations (avg, sum, min, max), filtering, grouping, and functions. Format: aggregation:metric.name{filter}[.function()]',
  ),
] as const

type MetricsToolHandlers = ToolHandlers<MetricsToolName>

export const createMetricsToolHandlers = (
  apiInstance: v1.MetricsApi,
): MetricsToolHandlers => {
  return {
    query_metrics: async (request) => {
      const { from, to, query } = parseWithWarnings(
        QueryMetricsZodSchema,
        request.params.arguments,
        'query_metrics',
      )

      // Parse time parameters to Unix timestamps
      const fromTimestamp =
        parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
      const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

      const response = await withRetry(() =>
        apiInstance.queryMetrics({
          from: fromTimestamp,
          to: toTimestamp,
          query,
        }),
      )

      return {
        content: [
          {
            type: 'text',
            text: `Queried metrics data: ${JSON.stringify({ response })}`,
          },
        ],
      }
    },
  }
}
