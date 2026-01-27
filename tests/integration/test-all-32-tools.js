#!/usr/bin/env node

/**
 * Comprehensive Test of All 32 Datadog MCP Tools
 * Tests every tool, tries different parameters if no data returned
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
try {
  const envFile = readFileSync(join(__dirname, '../../.env'), 'utf8')
  envFile.split('\n').forEach((line) => {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const match = line.match(/^export\s+([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        value = value.replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    }
  })
  console.log('✅ Loaded environment variables\n')
} catch (e) {
  console.warn('⚠️  Could not load .env:', e.message)
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

async function callMCPTool(toolName, args = {}, timeout = 10000) {
  return new Promise((resolve) => {
    const mcp = spawn('node', [join(__dirname, '../../build/index.js')], {
      env: process.env,
    })

    let stdout = ''
    let responses = []
    let timeoutId

    mcp.stdout.on('data', (data) => {
      stdout += data.toString()
      const lines = stdout.split('\n').filter((l) => l.trim())
      lines.forEach((line) => {
        try {
          const response = JSON.parse(line)
          responses.push(response)
        } catch {
          // Not JSON
        }
      })
    })

    mcp.on('close', () => {
      clearTimeout(timeoutId)
      resolve({ responses })
    })

    mcp.on('error', () => {
      clearTimeout(timeoutId)
      resolve({ responses: [] })
    })

    timeoutId = setTimeout(() => {
      mcp.kill()
      resolve({ responses })
    }, timeout)

    mcp.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }) + '\n',
    )

    setTimeout(() => {
      mcp.stdin.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: toolName, arguments: args },
        }) + '\n',
      )
      setTimeout(() => mcp.stdin.end(), 1000)
    }, 500)
  })
}

async function testTool(test) {
  const { name, description, args, category, alternatives } = test

  log(colors.cyan, `\n📊 [${category}] ${name}`)
  log(colors.blue, `   ${description}`)

  let result = await attemptToolCall(name, args)

  // If no data and alternatives provided, try them
  if (!result.success && result.isNoData && alternatives) {
    log(
      colors.yellow,
      `   ⚠️  No data with default params, trying alternatives...`,
    )
    for (const alt of alternatives) {
      log(colors.blue, `   🔄 Trying: ${alt.description}`)
      result = await attemptToolCall(name, alt.args)
      if (result.success || !result.isNoData) {
        break
      }
    }
  }

  return result
}

async function attemptToolCall(toolName, args) {
  try {
    const { responses } = await callMCPTool(toolName, args, 15000)
    const toolResponse = responses.find((r) => r.id === 2)

    if (toolResponse && toolResponse.error) {
      const errorMsg = toolResponse.error.message
      const isNoData =
        errorMsg.includes('No') &&
        (errorMsg.includes('data') || errorMsg.includes('returned'))

      if (isNoData) {
        log(colors.yellow, `   ⚠️  No data: ${errorMsg}`)
        return { success: false, isNoData: true, error: errorMsg }
      }

      log(colors.red, `   ❌ Error: ${errorMsg}`)
      return { success: false, isNoData: false, error: errorMsg }
    }

    if (toolResponse && toolResponse.result) {
      const content = toolResponse.result.content?.[0]?.text || ''
      const dataSize = content.length

      // Check if result has actual data
      // More sophisticated empty detection
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])

          // Check for truly empty data
          const isTrulyEmpty =
            (Array.isArray(parsed) && parsed.length === 0) ||
            (typeof parsed === 'object' && Object.keys(parsed).length === 0) ||
            parsed.total === 0 ||
            (parsed.slos &&
              Array.isArray(parsed.slos) &&
              parsed.slos.length === 0) ||
            (parsed.notebooks &&
              Array.isArray(parsed.notebooks) &&
              parsed.notebooks.length === 0) ||
            (content.includes('[]') &&
              !content.includes('"[') &&
              dataSize < 100)

          if (!isTrulyEmpty) {
            log(colors.green, `   ✅ Success! (${dataSize} bytes)`)
            const preview = content.substring(0, 200).replace(/\n/g, ' ')
            log(colors.blue, `   📄 ${preview}...`)
            return { success: true, dataSize, content }
          }
        }
      } catch {
        // If parsing fails, check data size
        if (dataSize > 100) {
          log(colors.green, `   ✅ Success! (${dataSize} bytes)`)
          const preview = content.substring(0, 200).replace(/\n/g, ' ')
          log(colors.blue, `   📄 ${preview}...`)
          return { success: true, dataSize, content }
        }
      }

      log(colors.yellow, `   ⚠️  Success but empty data`)
      return { success: true, isEmpty: true, content }
    }

    log(colors.red, `   ❌ No response`)
    return { success: false, error: 'No response' }
  } catch (error) {
    log(colors.red, `   ❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log(colors.green, '\n' + '='.repeat(80))
  log(colors.green, '🧪 Testing All 32 Datadog MCP Tools')
  log(colors.green, '='.repeat(80) + '\n')

  const now = Math.floor(Date.now() / 1000)
  const oneHourAgo = now - 3600
  const sevenDaysAgo = now - 604800

  // Get real services for testing (dev environment)
  const services = ['agent-api', 'burger-api', 'node-example']
  const rumApp = '5b110902-3a43-4f97-8555-5044453ba16a' // TNI Web

  const allTests = [
    // === Incidents (1) ===
    {
      name: 'incidents',
      description: 'Get incidents from Datadog',
      args: {},
      category: 'Incidents',
      alternatives: [{ description: 'With limit', args: { limit: 5 } }],
    },

    // === Logs (2) ===
    {
      name: 'get_logs',
      description: 'Search and retrieve logs',
      args: {
        query: `service:${services[0]}`,
        from: 'now-1h',
        to: 'now',
        limit: 5,
      },
      category: 'Logs',
      alternatives: [
        {
          description: 'Wildcard query',
          args: { query: '*', from: 'now-1h', to: 'now', limit: 5 },
        },
        {
          description: 'Error logs',
          args: { query: 'status:error', from: 'now-1h', to: 'now', limit: 5 },
        },
      ],
    },
    {
      name: 'get_all_services',
      description: 'Extract all unique service names',
      args: {},
      category: 'Logs',
    },

    // === Metrics (1) ===
    {
      name: 'query_metrics',
      description: 'Query timeseries metrics',
      args: { query: 'avg:system.cpu.user{*}', from: oneHourAgo, to: now },
      category: 'Metrics',
      alternatives: [
        {
          description: 'System load',
          args: { query: 'avg:system.load.1{*}', from: oneHourAgo, to: now },
        },
        {
          description: 'Network',
          args: {
            query: 'avg:system.net.bytes_sent{*}',
            from: oneHourAgo,
            to: now,
          },
        },
      ],
    },

    // === Monitors (1) ===
    {
      name: 'get_monitors',
      description: 'Get monitors status',
      args: {},
      category: 'Monitors',
      alternatives: [{ description: 'With limit', args: { limit: 10 } }],
    },

    // === Dashboards (2) ===
    {
      name: 'list_dashboards',
      description: 'List all dashboards',
      args: {},
      category: 'Dashboards',
      alternatives: [{ description: 'With limit', args: { limit: 10 } }],
    },
    {
      name: 'get_dashboard',
      description: 'Get specific dashboard by ID',
      args: { dashboardId: 'hjg-cu7-k2j' }, // Bits AI Burger Store
      category: 'Dashboards',
      alternatives: [
        {
          description: 'CI Visibility dashboard',
          args: { dashboardId: 'cj5-bmf-n3w' },
        },
      ],
    },

    // === Traces (1) ===
    {
      name: 'list_traces',
      description: 'Get APM traces',
      args: {
        query: `service:${services[0]}`,
        from: 'now-1h',
        to: 'now',
        limit: 5,
      },
      category: 'Traces',
      alternatives: [
        {
          description: 'Different service',
          args: {
            query: `service:${services[2]}`,
            from: 'now-1h',
            to: 'now',
            limit: 5,
          },
        },
        {
          description: 'Error traces',
          args: { query: 'status:error', from: 'now-1h', to: 'now', limit: 5 },
        },
      ],
    },

    // === Hosts (4) ===
    {
      name: 'list_hosts',
      description: 'Get list of hosts',
      args: {},
      category: 'Hosts',
      alternatives: [{ description: 'With limit', args: { limit: 10 } }],
    },
    {
      name: 'get_active_hosts_count',
      description: 'Get total active hosts count',
      args: {},
      category: 'Hosts',
    },
    {
      name: 'mute_host',
      description: 'Mute a host in Datadog',
      args: { hostname: 'test-host', message: 'Test mute from MCP' },
      category: 'Hosts',
      skip: true, // Skip destructive action
    },
    {
      name: 'unmute_host',
      description: 'Unmute a host in Datadog',
      args: { hostname: 'test-host' },
      category: 'Hosts',
      skip: true, // Skip destructive action
    },

    // === Downtimes (3) ===
    {
      name: 'list_downtimes',
      description: 'List scheduled downtimes',
      args: {},
      category: 'Downtimes',
    },
    {
      name: 'schedule_downtime',
      description: 'Schedule a downtime',
      args: {
        scope: ['host:test'],
        start: now,
        end: now + 3600,
        message: 'Test',
      },
      category: 'Downtimes',
      skip: true, // Skip destructive action
    },
    {
      name: 'cancel_downtime',
      description: 'Cancel a scheduled downtime',
      args: { downtime_id: 123456 },
      category: 'Downtimes',
      skip: true, // Skip destructive action
    },

    // === RUM (5) ===
    {
      name: 'get_rum_applications',
      description: 'Get all RUM applications',
      args: {},
      category: 'RUM',
    },
    {
      name: 'get_rum_events',
      description: 'Search and retrieve RUM events',
      args: { query: '@type:view', from: 'now-1h', to: 'now', limit: 5 },
      category: 'RUM',
      alternatives: [
        {
          description: 'Specific app',
          args: {
            query: `@application.id:${rumApp}`,
            from: 'now-1h',
            to: 'now',
            limit: 5,
          },
        },
        {
          description: 'Actions',
          args: { query: '@type:action', from: 'now-1h', to: 'now', limit: 5 },
        },
      ],
    },
    {
      name: 'get_rum_grouped_event_count',
      description: 'Group and count RUM events',
      args: {
        query: '@type:view',
        from: 'now-1h',
        to: 'now',
        groupBy: 'application.name',
      },
      category: 'RUM',
    },
    {
      name: 'get_rum_page_performance',
      description: 'Get page performance metrics',
      args: {
        query: `@application.id:${rumApp}`,
        from: 'now-7d',
        to: 'now',
        metricNames: ['@view.loading_time', '@view.time_spent'],
      },
      category: 'RUM',
    },
    {
      name: 'get_rum_page_waterfall',
      description: 'Get RUM page waterfall data',
      args: { applicationName: 'Smartsales', sessionId: 'test-session' },
      category: 'RUM',
      skip: true, // Requires specific session ID
    },

    // === SLO (3) ===
    {
      name: 'list_slos',
      description: 'List Service Level Objectives',
      args: {},
      category: 'SLO',
      alternatives: [{ description: 'With limit', args: { limit: 10 } }],
    },
    {
      name: 'get_slo',
      description: 'Get specific SLO by ID',
      args: { slo_id: '67d242f542d05793aecf08bfdee343dd' }, // agent-api SLO
      category: 'SLO',
    },
    {
      name: 'get_slo_history',
      description: 'Get SLO history over time',
      args: {
        slo_id: '67d242f542d05793aecf08bfdee343dd', // agent-api SLO
        from: sevenDaysAgo,
        to: now,
      },
      category: 'SLO',
    },

    // === APM (5) ===
    {
      name: 'list_service_definitions',
      description: 'List service definitions from Service Catalog',
      args: { page_size: 10 },
      category: 'APM',
    },
    {
      name: 'get_service_stats_realtime',
      description: 'Get real-time APM service statistics',
      args: { service: services[0], from: 'now-7d', to: 'now' }, // agent-api in dev env
      category: 'APM',
      alternatives: [
        {
          description: 'Different service',
          args: { service: services[1], from: 'now-7d', to: 'now' }, // burger-api
        },
      ],
    },
    {
      name: 'get_service_stats_aggregated',
      description: 'Get aggregated APM statistics (pre-aggregated metrics)',
      args: { service: services[0], from: 'now-7d', to: 'now' }, // agent-api
      category: 'APM',
      alternatives: [
        {
          description: 'burger-api service',
          args: { service: services[1], from: 'now-7d', to: 'now' },
        },
      ],
    },
    {
      name: 'get_service_endpoints',
      description: 'Discover service API endpoints',
      args: {
        service: services[0], // agent-api
        from: 'now-7d',
        to: 'now',
        limit: 10,
      },
      category: 'APM',
      alternatives: [
        {
          description: 'burger-api service',
          args: { service: services[1], from: 'now-7d', to: 'now', limit: 10 },
        },
      ],
    },
    {
      name: 'get_operation_stats',
      description: 'Get statistics for specific operation/endpoint',
      args: {
        service: services[0],
        operation: 'postgresql.query',
        from: sevenDaysAgo,
        to: now,
        env: 'uat',
      },
      category: 'APM',
      skip: true, // Requires knowing specific operation name
    },

    // === Notebooks (5) ===
    {
      name: 'list_notebooks',
      description: 'List all Datadog notebooks',
      args: { count: 5 },
      category: 'Notebooks',
    },
    {
      name: 'get_notebook',
      description: 'Get specific notebook by ID',
      args: { notebook_id: 12853659 },
      category: 'Notebooks',
    },
    {
      name: 'create_notebook',
      description: 'Create a new notebook',
      args: {
        name: 'MCP Test Notebook',
        content: '# Test\nThis is a test notebook created by MCP.',
      },
      category: 'Notebooks',
      skip: true, // Skip creation
    },
    {
      name: 'update_notebook',
      description: 'Update an existing notebook',
      args: { notebook_id: 12853659, name: 'Updated Name' },
      category: 'Notebooks',
      skip: true, // Skip modification
    },
    {
      name: 'delete_notebook',
      description: 'Delete a notebook',
      args: { notebook_id: 99999999 },
      category: 'Notebooks',
      skip: true, // Skip deletion
    },
  ]

  let passed = 0
  let failed = 0
  let skipped = 0
  let noData = 0
  const results = {}
  const improvements = []

  for (const test of allTests) {
    if (test.skip) {
      log(colors.magenta, `\n📊 [${test.category}] ${test.name}`)
      log(colors.yellow, `   ⏭️  SKIPPED (${test.description})`)
      skipped++
      continue
    }

    const result = await testTool(test)

    if (!results[test.category]) {
      results[test.category] = { passed: 0, failed: 0, skipped: 0, noData: 0 }
    }

    if (result.success) {
      if (result.isEmpty) {
        noData++
        results[test.category].noData++
        improvements.push({
          tool: test.name,
          category: test.category,
          issue: 'Returns empty data',
          recommendation:
            'Add better default parameters or improve documentation',
        })
      } else {
        passed++
        results[test.category].passed++
      }
    } else {
      if (result.isNoData) {
        noData++
        results[test.category].noData++
        improvements.push({
          tool: test.name,
          category: test.category,
          issue: result.error,
          recommendation: 'Improve default parameters or add examples',
        })
      } else {
        failed++
        results[test.category].failed++
        improvements.push({
          tool: test.name,
          category: test.category,
          issue: result.error,
          recommendation: 'Fix error or improve error message',
        })
      }
    }
  }

  // Print Summary
  log(colors.green, '\n\n' + '='.repeat(80))
  log(colors.green, '📊 Test Summary by Category')
  log(colors.green, '='.repeat(80) + '\n')

  Object.entries(results).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed + stats.noData
    const passRate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : 0

    log(colors.cyan, `${category}:`)
    log(colors.green, `  ✅ Passed:  ${stats.passed}`)
    if (stats.failed > 0) {
      log(colors.red, `  ❌ Failed:  ${stats.failed}`)
    }
    if (stats.noData > 0) {
      log(colors.yellow, `  ⚠️  No Data: ${stats.noData}`)
    }
    log(colors.blue, `  📈 Pass Rate: ${passRate}%\n`)
  })

  log(colors.green, '='.repeat(80))
  log(colors.green, '🎯 Overall Results')
  log(colors.green, '='.repeat(80) + '\n')

  log(colors.green, `✅ Passed:  ${passed}`)
  if (failed > 0) {
    log(colors.red, `❌ Failed:  ${failed}`)
  }
  if (noData > 0) {
    log(colors.yellow, `⚠️  No Data: ${noData}`)
  }
  if (skipped > 0) {
    log(colors.magenta, `⏭️  Skipped: ${skipped}`)
  }
  const total = passed + failed + noData + skipped
  log(colors.cyan, `📊 Total:   ${total}`)
  log(
    colors.blue,
    `📈 Success Rate: ${((passed / (passed + failed + noData)) * 100).toFixed(1)}%\n`,
  )

  // Save improvements
  if (improvements.length > 0) {
    log(colors.magenta, '\n💡 Recommended Improvements:\n')
    improvements.forEach((imp, idx) => {
      log(colors.yellow, `${idx + 1}. [${imp.category}] ${imp.tool}`)
      log(colors.blue, `   Issue: ${imp.issue}`)
      log(colors.green, `   Fix: ${imp.recommendation}\n`)
    })

    // Save to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, noData, skipped, total },
      improvements,
    }
    writeFileSync(
      join(__dirname, 'test-results.json'),
      JSON.stringify(report, null, 2),
    )
    log(
      colors.cyan,
      `📝 Detailed results saved to tests/integration/test-results.json\n`,
    )
  }

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  log(colors.red, '❌ Fatal error:', error)
  process.exit(1)
})
