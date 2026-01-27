#!/usr/bin/env node

/**
 * Test HIGH Priority Fixes
 * Verifies all HIGH severity issues have been resolved
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
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve) => {
    const mcp = spawn('node', [join(__dirname, 'build/index.js')], {
      env: process.env,
    })

    let stdout = ''
    let responses = []

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

    mcp.on('close', () => resolve({ responses }))
    mcp.on('error', (error) => resolve({ responses: [], error }))

    setTimeout(() => {
      mcp.kill()
      resolve({ responses })
    }, 5000)

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

async function testFix(fixNumber, description, toolName, args) {
  log(colors.cyan, `\n🔧 Fix #${fixNumber}: ${description}`)
  log(colors.blue, `   Tool: ${toolName}`)
  log(
    colors.yellow,
    `   Args: ${JSON.stringify(args, null, 2).replace(/\n/g, '\n   ')}`,
  )

  try {
    const { responses } = await callMCPTool(toolName, args)
    const toolResponse = responses.find((r) => r.id === 2)

    if (toolResponse && toolResponse.error) {
      log(colors.red, '   ❌ FAILED:', toolResponse.error.message)
      return false
    }

    if (toolResponse && toolResponse.result) {
      log(colors.green, '   ✅ FIXED - Tool works correctly!')
      return true
    }

    log(colors.yellow, '   ⚠️  Uncertain - no clear response')
    return false
  } catch (error) {
    log(colors.red, '   ❌ FAILED:', error.message)
    return false
  }
}

async function runTests() {
  log(colors.green, '\n' + '='.repeat(80))
  log(colors.green, '🔧 HIGH Priority Fixes Verification')
  log(colors.green, '='.repeat(80) + '\n')

  const now = Math.floor(Date.now() / 1000)
  const oneHourAgo = now - 3600

  const fixes = [
    {
      number: 1,
      description: 'Fix "unknown type \'number\'" - Accept string time values',
      toolName: 'get_service_stats_aggregated',
      args: {
        service: 'agent-api',
        from: 'now-1h', // String instead of number
        to: 'now',
      },
    },
    {
      number: 2,
      description: 'Fix milliseconds detection - Auto-convert ms to seconds',
      toolName: 'get_logs',
      args: {
        query: 'service:agent-api',
        from: oneHourAgo * 1000, // Pass milliseconds
        to: now * 1000,
        limit: 5,
      },
    },
    {
      number: 3,
      description: 'Fix RUM "Invalid time value" - Handle string times',
      toolName: 'get_rum_events',
      args: {
        query: '@type:view',
        from: 'now-1h', // String time
        to: 'now',
        limit: 5,
      },
    },
    {
      number: 4,
      description: 'Fix traces "Invalid time value" - Handle string times',
      toolName: 'list_traces',
      args: {
        query: 'service:agent-api',
        from: 'now-1h', // String time
        to: 'now',
        limit: 5,
      },
    },
    {
      number: 5,
      description: 'Fix logs with Unix timestamps',
      toolName: 'get_logs',
      args: {
        query: 'service:agent-api',
        from: oneHourAgo, // Unix seconds
        to: now,
        limit: 5,
      },
    },
    {
      number: 6,
      description: 'Fix RUM page performance with string times',
      toolName: 'get_rum_page_performance',
      args: {
        query: '@application.id:c5691cc1-cc7a-42d1-8257-1856826a9aa1',
        from: 'now-1h',
        to: 'now',
        metricNames: ['@view.loading_time', '@view.time_spent'],
      },
    },
  ]

  let passed = 0
  let failed = 0

  for (const fix of fixes) {
    const result = await testFix(
      fix.number,
      fix.description,
      fix.toolName,
      fix.args,
    )
    if (result) {
      passed++
    } else {
      failed++
    }
  }

  log(colors.green, '\n\n' + '='.repeat(80))
  log(colors.green, '🎯 HIGH Priority Fixes - Summary')
  log(colors.green, '='.repeat(80) + '\n')

  log(colors.green, `✅ Fixed:  ${passed}/${fixes.length}`)
  if (failed > 0) {
    log(colors.red, `❌ Failed: ${failed}/${fixes.length}`)
  }
  log(
    colors.cyan,
    `📊 Success Rate: ${((passed / fixes.length) * 100).toFixed(1)}%\n`,
  )

  if (passed === fixes.length) {
    log(colors.green, '🎉 ALL HIGH PRIORITY ISSUES FIXED!\n')
  } else {
    log(colors.red, '⚠️  Some issues remain - check logs above\n')
  }

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  log(colors.red, '❌ Fatal error:', error)
  process.exit(1)
})
