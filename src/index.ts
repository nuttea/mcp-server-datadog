#!/usr/bin/env node

/**
 * This script sets up the mcp-server-datadog.
 * It initializes an MCP server that integrates with Datadog for incident management.
 * By leveraging MCP, this server can list and retrieve incidents via the Datadog incident API.
 * With a design built for scalability, future integrations with additional Datadog APIs are anticipated.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { log, mcpDatadogVersion } from './utils/helper'
import { INCIDENT_TOOLS, createIncidentToolHandlers } from './tools/incident'
import { METRICS_TOOLS, createMetricsToolHandlers } from './tools/metrics'
import { LOGS_TOOLS, createLogsToolHandlers } from './tools/logs'
import { MONITORS_TOOLS, createMonitorsToolHandlers } from './tools/monitors'
import {
  DASHBOARDS_TOOLS,
  createDashboardsToolHandlers,
} from './tools/dashboards'
import { TRACES_TOOLS, createTracesToolHandlers } from './tools/traces'
import { HOSTS_TOOLS, createHostsToolHandlers } from './tools/hosts'
import { ToolHandlers } from './utils/types'
import { createDatadogConfig } from './utils/datadog'
import { createDowntimesToolHandlers, DOWNTIMES_TOOLS } from './tools/downtimes'
import { createRumToolHandlers, RUM_TOOLS } from './tools/rum'
import { createSLOToolHandlers, SLO_TOOLS } from './tools/slo'
import { createAPMToolHandlers, APM_TOOLS } from './tools/apm'
import { createHandlers as createNotebooksToolHandlers } from './tools/notebooks'
import { v2, v1 } from '@datadog/datadog-api-client'

const server = new Server(
  {
    name: 'Datadog MCP Server',
    version: mcpDatadogVersion,
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

server.onerror = (error) => {
  log('error', `Server error: ${error.message}`, error.stack)
}

/**
 * Handler that retrieves the list of available tools in the mcp-server-datadog.
 * Currently, it provides incident management functionalities by integrating with Datadog's incident APIs.
 */
// Notebook tool definitions
const NOTEBOOKS_TOOLS = [
  {
    name: 'create_notebook',
    description: 'Create a new Datadog Notebook from markdown content',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Notebook name' },
        content: {
          type: 'string',
          description: 'Markdown content for the notebook',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags (e.g., ["team:sre", "assessment"])',
        },
        time_live_span: {
          type: 'string',
          description: 'Default timeframe (1h, 4h, 1d, 1w, 1mo)',
        },
      },
      required: ['name', 'content'],
    },
  },
  {
    name: 'list_notebooks',
    description: 'List all Datadog Notebooks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        author_handle: { type: 'string', description: 'Filter by author' },
        query: { type: 'string', description: 'Search query' },
        count: {
          type: 'number',
          description: 'Number to return (max 1000)',
          default: 100,
        },
      },
    },
  },
  {
    name: 'get_notebook',
    description: 'Get a specific Datadog Notebook by ID',
    inputSchema: {
      type: 'object',
      properties: {
        notebook_id: { type: 'number', description: 'Notebook ID' },
      },
      required: ['notebook_id'],
    },
  },
  {
    name: 'update_notebook',
    description: 'Update an existing Datadog Notebook',
    inputSchema: {
      type: 'object',
      properties: {
        notebook_id: { type: 'number', description: 'Notebook ID to update' },
        name: { type: 'string', description: 'New name' },
        content: { type: 'string', description: 'New markdown content' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated tags',
        },
        status: {
          type: 'string',
          enum: ['published', 'unpublished'],
          description: 'Publication status',
        },
      },
      required: ['notebook_id'],
    },
  },
  {
    name: 'delete_notebook',
    description: 'Delete a Datadog Notebook',
    inputSchema: {
      type: 'object',
      properties: {
        notebook_id: { type: 'number', description: 'Notebook ID to delete' },
      },
      required: ['notebook_id'],
    },
  },
]

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...INCIDENT_TOOLS,
      ...METRICS_TOOLS,
      ...LOGS_TOOLS,
      ...MONITORS_TOOLS,
      ...DASHBOARDS_TOOLS,
      ...TRACES_TOOLS,
      ...HOSTS_TOOLS,
      ...DOWNTIMES_TOOLS,
      ...RUM_TOOLS,
      ...SLO_TOOLS,
      ...APM_TOOLS,
      ...NOTEBOOKS_TOOLS,
    ],
  }
})

if (!process.env.DATADOG_API_KEY || !process.env.DATADOG_APP_KEY) {
  throw new Error('DATADOG_API_KEY and DATADOG_APP_KEY must be set')
}

const datadogConfig = createDatadogConfig({
  apiKeyAuth: process.env.DATADOG_API_KEY,
  appKeyAuth: process.env.DATADOG_APP_KEY,
  site: process.env.DATADOG_SITE,
  subdomain: process.env.DATADOG_SUBDOMAIN,
})

const TOOL_HANDLERS: ToolHandlers = {
  ...createIncidentToolHandlers(new v2.IncidentsApi(datadogConfig)),
  ...createMetricsToolHandlers(new v1.MetricsApi(datadogConfig)),
  ...createLogsToolHandlers(new v2.LogsApi(datadogConfig)),
  ...createMonitorsToolHandlers(new v1.MonitorsApi(datadogConfig)),
  ...createDashboardsToolHandlers(new v1.DashboardsApi(datadogConfig)),
  ...createTracesToolHandlers(new v2.SpansApi(datadogConfig)),
  ...createHostsToolHandlers(new v1.HostsApi(datadogConfig)),
  ...createDowntimesToolHandlers(new v1.DowntimesApi(datadogConfig)),
  ...createRumToolHandlers(new v2.RUMApi(datadogConfig)),
  ...createSLOToolHandlers(new v1.ServiceLevelObjectivesApi(datadogConfig)),
  ...createAPMToolHandlers(
    new v2.SpansApi(datadogConfig),
    new v1.MetricsApi(datadogConfig),
    new v2.ServiceDefinitionApi(datadogConfig),
  ),
  ...createNotebooksToolHandlers(new v1.NotebooksApi(datadogConfig)),
}
/**
 * Handler for invoking Datadog-related tools in the mcp-server-datadog.
 * The TOOL_HANDLERS object contains various tools that interact with different Datadog APIs.
 * By specifying the tool name in the request, the LLM can select and utilize the required tool.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (TOOL_HANDLERS[request.params.name]) {
      return await TOOL_HANDLERS[request.params.name](request)
    }
    throw new Error('Unknown tool')
  } catch (unknownError) {
    const error =
      unknownError instanceof Error
        ? unknownError
        : new Error(String(unknownError))
    log(
      'error',
      `Request: ${request.params.name}, ${JSON.stringify(request.params.arguments)} failed`,
      error.message,
      error.stack,
    )
    throw error
  }
})

/**
 * Initializes and starts the mcp-server-datadog using stdio transport,
 * which sends and receives data through standard input and output.
 */
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  log('error', 'Server error:', error)
  process.exit(1)
})
