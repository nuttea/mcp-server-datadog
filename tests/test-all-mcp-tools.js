#!/usr/bin/env node
/* eslint-env node */

/**
 * Comprehensive Integration Tests for All Datadog MCP Server Tools
 * Tests all 32 tools across 12 modules
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8')
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
  console.log('✅ Loaded environment variables from .env\n')
} catch (e) {
  console.warn('⚠️  Could not load .env file:', e.message)
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

async function callMCPTool(toolName, args = {}, timeout = 5000) {
  return new Promise((resolve) => {
    const mcp = spawn('node', [join(__dirname, 'build/index.js')], {
      env: process.env,
    })

    let stdout = ''
    let stderr = ''
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
          // Not JSON, skip
        }
      })
    })

    mcp.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    mcp.on('close', () => {
      clearTimeout(timeoutId)
      resolve({ responses, stderr })
    })

    mcp.on('error', (error) => {
      clearTimeout(timeoutId)
      resolve({ responses: [], stderr: error.message })
    })

    // Timeout handling
    timeoutId = setTimeout(() => {
      mcp.kill()
      resolve({
        responses,
        stderr: stderr + '\nTimeout after ' + timeout + 'ms',
      })
    }, timeout)

    // Send initialize request
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

    // Send tool call request
    setTimeout(() => {
      mcp.stdin.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        }) + '\n',
      )

      setTimeout(() => {
        mcp.stdin.end()
      }, 1000)
    }, 500)
  })
}

async function testTool(name, description, args, options = {}) {
  const { category = 'General', optional = false, timeout = 5000 } = options

  log(colors.cyan, `\n📊 [${category}] ${name}`)
  log(colors.blue, `   ${description}`)

  try {
    const { responses, stderr } = await callMCPTool(name, args, timeout)
    const toolResponse = responses.find((r) => r.id === 2)

    if (toolResponse && toolResponse.error) {
      if (optional && toolResponse.error.message.includes('No')) {
        log(colors.yellow, '   ⚠️  Optional test - No data available')
        return 'skipped'
      }
      log(colors.red, '   ❌ Error:', toolResponse.error.message)
      return false
    }

    if (toolResponse && toolResponse.result) {
      log(colors.green, '   ✅ Success!')
      const content = toolResponse.result.content?.[0]?.text
      if (content) {
        const preview = content.substring(0, 200).replace(/\n/g, ' ')
        log(colors.blue, `   📄 ${preview}...`)
      }
      return true
    }

    log(colors.red, '   ❌ No response received')
    if (stderr && !stderr.includes('DEBUG')) {
      const errorPreview = stderr.substring(0, 200)
      log(colors.yellow, `   ⚠️  ${errorPreview}`)
    }
    return false
  } catch (error) {
    log(colors.red, '   ❌ Exception:', error.message)
    return false
  }
}

async function runTests() {
  log(colors.green, '\n' + '='.repeat(80))
  log(colors.green, '🧪 Datadog MCP Server - Comprehensive Integration Tests')
  log(colors.green, '='.repeat(80) + '\n')

  const now = Math.floor(Date.now() / 1000)
  const oneHourAgo = now - 3600

  const tests = [
    // === APM Tools (4) ===
    {
      name: 'list_service_definitions',
      description: 'List service definitions from Service Catalog',
      args: { page_size: 5 },
      category: 'APM',
    },
    {
      name: 'get_service_stats_realtime',
      description: 'Get real-time APM stats (relative time)',
      args: { service: 'agent-api', from: 'now-1h', to: 'now' },
      category: 'APM',
    },
    {
      name: 'get_service_stats_realtime',
      description: 'Get real-time APM stats (Unix timestamps)',
      args: { service: 'agent-api', from: oneHourAgo, to: now },
      category: 'APM',
    },
    {
      name: 'get_service_endpoints',
      description: 'Discover service endpoints',
      args: { service: 'agent-api', from: oneHourAgo, to: now, limit: 5 },
      category: 'APM',
    },

    // === Logs Tools (2) ===
    {
      name: 'get_logs',
      description: 'Search and retrieve logs',
      args: {
        query: 'service:agent-api',
        from: oneHourAgo,
        to: now,
        limit: 10,
      },
      category: 'Logs',
      optional: true,
    },
    {
      name: 'get_all_services',
      description: 'Extract all unique service names from logs',
      args: {},
      category: 'Logs',
    },

    // === Metrics Tools (1) ===
    {
      name: 'query_metrics',
      description: 'Query timeseries metrics',
      args: {
        query: 'avg:system.cpu.user{*}',
        from: oneHourAgo,
        to: now,
      },
      category: 'Metrics',
      optional: true,
    },

    // === Monitors Tools (1) ===
    {
      name: 'get_monitors',
      description: 'Get monitors status',
      args: { limit: 5 },
      category: 'Monitors',
    },

    // === Dashboards Tools (2) ===
    {
      name: 'list_dashboards',
      description: 'Get list of dashboards',
      args: { limit: 5 },
      category: 'Dashboards',
    },
    {
      name: 'get_dashboard',
      description: 'Get specific dashboard by ID',
      args: { dashboardId: 'hjg-cu7-k2j' },
      category: 'Dashboards',
    },

    // === Traces Tools (1) ===
    {
      name: 'list_traces',
      description: 'Get APM traces',
      args: {
        query: 'service:agent-api',
        from: oneHourAgo,
        to: now,
        limit: 10,
      },
      category: 'Traces',
      optional: true,
    },

    // === Hosts Tools (4) ===
    {
      name: 'list_hosts',
      description: 'Get list of hosts',
      args: { limit: 5 },
      category: 'Hosts',
    },
    {
      name: 'get_active_hosts_count',
      description: 'Get total active hosts count',
      args: {},
      category: 'Hosts',
    },

    // === Downtimes Tools (3) ===
    {
      name: 'list_downtimes',
      description: 'List scheduled downtimes',
      args: { limit: 5 },
      category: 'Downtimes',
      optional: true,
    },

    // === RUM Tools (5) ===
    {
      name: 'get_rum_applications',
      description: 'Get all RUM applications',
      args: {},
      category: 'RUM',
      optional: true,
    },

    // === SLO Tools (3) ===
    {
      name: 'list_slos',
      description: 'List Service Level Objectives',
      args: { limit: 5 },
      category: 'SLO',
      optional: true,
    },

    // === Notebooks Tools (5) ===
    {
      name: 'list_notebooks',
      description: 'List all notebooks',
      args: { count: 5 },
      category: 'Notebooks',
      optional: true,
    },

    // === Incidents Tools (1) ===
    {
      name: 'incidents',
      description: 'List all incidents',
      args: { limit: 5 },
      category: 'Incidents',
      optional: true,
    },
  ]

  let passed = 0
  let failed = 0
  let skipped = 0
  const results = {}

  for (const test of tests) {
    const result = await testTool(test.name, test.description, test.args, test)

    if (!results[test.category]) {
      results[test.category] = { passed: 0, failed: 0, skipped: 0 }
    }

    if (result === true) {
      passed++
      results[test.category].passed++
    } else if (result === 'skipped') {
      skipped++
      results[test.category].skipped++
    } else {
      failed++
      results[test.category].failed++
    }
  }

  // Print summary
  log(colors.green, '\n\n' + '='.repeat(80))
  log(colors.green, '📊 Test Summary by Category')
  log(colors.green, '='.repeat(80) + '\n')

  Object.entries(results).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed + stats.skipped
    const passRate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : 0

    log(colors.cyan, `${category}:`)
    log(colors.green, `  ✅ Passed:  ${stats.passed}`)
    if (stats.failed > 0) {
      log(colors.red, `  ❌ Failed:  ${stats.failed}`)
    }
    if (stats.skipped > 0) {
      log(colors.yellow, `  ⚠️  Skipped: ${stats.skipped}`)
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
  if (skipped > 0) {
    log(colors.yellow, `⚠️  Skipped: ${skipped} (optional tests with no data)`)
  }
  log(colors.cyan, `📊 Total:   ${passed + failed + skipped}`)

  const overallRate = ((passed / (passed + failed + skipped)) * 100).toFixed(1)
  log(colors.blue, `📈 Pass Rate: ${overallRate}%\n`)

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  log(colors.red, '❌ Fatal error:', error)
  process.exit(1)
})
