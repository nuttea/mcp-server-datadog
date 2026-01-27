import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v2 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import { ListTracesZodSchema } from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { parseTimeParam } from '../../utils/relative-time'

type TracesToolName = 'list_traces'
type TracesTool = ExtendedTool<TracesToolName>

export const TRACES_TOOLS: TracesTool[] = [
  createToolSchema(
    ListTracesZodSchema,
    'list_traces',
    'Get APM traces from Datadog',
  ),
] as const

type TracesToolHandlers = ToolHandlers<TracesToolName>

export const createTracesToolHandlers = (
  apiInstance: v2.SpansApi,
): TracesToolHandlers => {
  return {
    list_traces: async (request) => {
      const {
        query,
        from,
        to,
        limit = 100,
        sort = '-timestamp',
        service,
        operation,
      } = parseWithWarnings(
        ListTracesZodSchema,
        request.params.arguments,
        'list_traces',
      )

      // Convert time parameters to Unix timestamps in seconds
      const fromTimestamp =
        parseTimeParam(from) ?? Math.floor(Date.now() / 1000) - 3600
      const toTimestamp = parseTimeParam(to) ?? Math.floor(Date.now() / 1000)

      const response = await withRetry(() =>
        apiInstance.listSpans({
          body: {
            data: {
              attributes: {
                filter: {
                  query: [
                    query,
                    ...(service ? [`service:${service}`] : []),
                    ...(operation ? [`operation:${operation}`] : []),
                  ].join(' '),
                  from: new Date(fromTimestamp * 1000).toISOString(),
                  to: new Date(toTimestamp * 1000).toISOString(),
                },
                sort: sort as 'timestamp' | '-timestamp',
                page: { limit },
              },
              type: 'search_request',
            },
          },
        }),
      )

      if (!response.data) {
        throw new Error('No traces data returned')
      }

      return {
        content: [
          {
            type: 'text',
            text: `Traces: ${JSON.stringify({
              traces: response.data,
              count: response.data.length,
            })}`,
          },
        ],
      }
    },
  }
}
