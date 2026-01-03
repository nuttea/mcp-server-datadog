import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v2 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import { IncidentsZodSchema } from './schema'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'

type IncidentToolName = 'incidents'
type IncidentTool = ExtendedTool<IncidentToolName>

export const INCIDENT_TOOLS: IncidentTool[] = [
  createToolSchema(
    IncidentsZodSchema,
    'incidents',
    'Get incidents from Datadog - list all or get specific incident by ID',
  ),
] as const

type IncidentToolHandlers = ToolHandlers<IncidentToolName>

export const createIncidentToolHandlers = (
  apiInstance: v2.IncidentsApi,
): IncidentToolHandlers => {
  return {
    incidents: async (request) => {
      const { incidentId, pageSize, pageOffset } = parseWithWarnings(
        IncidentsZodSchema,
        request.params.arguments,
        'incidents',
      )

      // If incidentId provided, get specific incident
      if (incidentId) {
        const response = await withRetry(() =>
          apiInstance.getIncident({
            incidentId,
          }),
        )

        if (response.data == null) {
          throw new Error('No incident data returned')
        }

        return {
          content: [
            {
              type: 'text',
              text: `Incident: ${JSON.stringify(response.data)}`,
            },
          ],
        }
      }

      // Otherwise, list all incidents
      const response = await withRetry(() =>
        apiInstance.listIncidents({
          pageSize,
          pageOffset,
        }),
      )

      if (response.data == null) {
        throw new Error('No incidents data returned')
      }

      return {
        content: [
          {
            type: 'text',
            text: `Listed incidents:\n${response.data
              .map((d) => JSON.stringify(d))
              .join('\n')}`,
          },
        ],
      }
    },
  }
}
