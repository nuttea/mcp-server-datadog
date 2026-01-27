#!/usr/bin/env node

/**
 * Test All APM Tools for mysmartsales_cpf_uat Service
 * Verifies get_service_stats_realtime, get_service_endpoints, etc.
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
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
          // Not JSON
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

    timeoutId = setTimeout(() => {
      mcp.kill()
      resolve({ responses, stderr: stderr + '\nTimeout' })
    }, timeout)

    // Initialize
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

    // Call tool
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

async function testTool(name, description, toolName, args) {
  log(colors.cyan, `\n📊 ${name}`)
  log(colors.blue, `   ${description}`)

  try {
    const { responses } = await callMCPTool(toolName, args, 15000)
    const toolResponse = responses.find((r) => r.id === 2)

    if (toolResponse && toolResponse.error) {
      log(colors.red, '   ❌ Error:', toolResponse.error.message)
      return false
    }

    if (toolResponse && toolResponse.result) {
      log(colors.green, '   ✅ Success!')
      const content = toolResponse.result.content?.[0]?.text
      if (content) {
        try {
          const parsed = JSON.parse(content.replace(/^[^{]+/, ''))
          log(
            colors.blue,
            `   📊 Result:`,
            JSON.stringify(parsed, null, 2).substring(0, 400),
          )
        } catch {
          log(colors.blue, `   📄 ${content.substring(0, 300)}`)
        }
      }
      return true
    }

    log(colors.yellow, '   ⚠️  No clear response')
    return false
  } catch (error) {
    log(colors.red, '   ❌ Exception:', error.message)
    return false
  }
}

async function runTests() {
  const SERVICE = 'mysmartsales_cpf_uat'
  const ENV = 'uat'

  log(colors.green, '\n' + '='.repeat(80))
  log(colors.green, `🧪 Testing APM Tools for Service: ${SERVICE}`)
  log(colors.green, '='.repeat(80))
  log(colors.magenta, `Environment: ${ENV}`)
  log(colors.magenta, `Timeframe: Last 7 days\n`)

  const now = Math.floor(Date.now() / 1000)
  const sevenDaysAgo = now - 604800

  const tests = [
    {
      name: 'Test 1: Get All Services',
      description: 'Verify service discovery includes mysmartsales_cpf_uat',
      toolName: 'get_all_services',
      args: {},
    },
    {
      name: 'Test 2: Get Service Stats (Relative Time)',
      description: 'Real-time APM statistics with relative time',
      toolName: 'get_service_stats_realtime',
      args: {
        service: SERVICE,
        from: 'now-7d',
        to: 'now',
        env: ENV,
      },
    },
    {
      name: 'Test 3: Get Service Stats (Unix Timestamps)',
      description: 'Real-time APM statistics with Unix timestamps',
      toolName: 'get_service_stats_realtime',
      args: {
        service: SERVICE,
        from: sevenDaysAgo,
        to: now,
        env: ENV,
      },
    },
    {
      name: 'Test 4: Get Service Stats (Aggregated Metrics)',
      description: 'Aggregated service statistics',
      toolName: 'get_service_stats_aggregated',
      args: {
        service: SERVICE,
        from: 'now-7d',
        to: 'now',
        env: ENV,
      },
    },
    {
      name: 'Test 5: Get Service Endpoints',
      description: 'Discover API endpoints/resources',
      toolName: 'get_service_endpoints',
      args: {
        service: SERVICE,
        from: sevenDaysAgo,
        to: now,
        env: ENV,
        limit: 10,
      },
    },
    {
      name: 'Test 6: List Traces',
      description: 'Get APM traces for the service',
      toolName: 'list_traces',
      args: {
        query: `service:${SERVICE}`,
        from: 'now-7d',
        to: 'now',
        limit: 5,
      },
    },
    {
      name: 'Test 7: Get Logs',
      description: 'Get logs for the service',
      toolName: 'get_logs',
      args: {
        query: `service:${SERVICE}`,
        from: 'now-7d',
        to: 'now',
        limit: 5,
      },
    },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    const result = await testTool(
      test.name,
      test.description,
      test.toolName,
      test.args,
    )
    if (result) {
      passed++
    } else {
      failed++
    }
  }

  log(colors.green, '\n\n' + '='.repeat(80))
  log(colors.green, `🎯 Test Results for ${SERVICE}`)
  log(colors.green, '='.repeat(80) + '\n')

  log(colors.green, `✅ Passed: ${passed}/${tests.length}`)
  if (failed > 0) {
    log(colors.red, `❌ Failed: ${failed}/${tests.length}`)
  }
  const passRate = ((passed / tests.length) * 100).toFixed(1)
  log(colors.cyan, `📈 Pass Rate: ${passRate}%\n`)

  if (passed === tests.length) {
    log(colors.green, '🎉 ALL TESTS PASSED! Service is fully operational.\n')
  } else {
    log(colors.yellow, `⚠️  ${failed} test(s) failed - check errors above\n`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  log(colors.red, '❌ Fatal error:', error)
  process.exit(1)
})
