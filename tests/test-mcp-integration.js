#!/usr/bin/env node
/* eslint-env node */

/**
 * Integration test for MCP tools
 * Tests all APM tools with proper error handling and detailed output
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
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    }
  })
  console.log('✅ Loaded environment variables from .env')
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
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const mcp = spawn('node', [join(__dirname, 'build/index.js')], {
      env: process.env,
    })

    let stdout = ''
    let stderr = ''
    let responses = []

    mcp.stdout.on('data', (data) => {
      stdout += data.toString()
      // Parse JSON-RPC responses
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
      resolve({ responses, stderr })
    })

    mcp.on('error', (error) => {
      reject(error)
    })

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

      // Give it time to process
      setTimeout(() => {
        mcp.stdin.end()
      }, 2000)
    }, 500)
  })
}

async function testTool(name, description, args) {
  log(colors.cyan, `\n📊 Testing: ${name}`)
  log(colors.blue, `   ${description}`)
  log(colors.yellow, `   Args: ${JSON.stringify(args)}`)

  try {
    const { responses, stderr } = await callMCPTool(name, args)

    // Find the tool call response
    const toolResponse = responses.find((r) => r.id === 2)

    if (toolResponse && toolResponse.error) {
      log(colors.red, '   ❌ Error:', toolResponse.error.message)
      if (stderr) {
        log(colors.yellow, '   Stderr:', stderr.substring(0, 500))
      }
      return false
    }

    if (toolResponse && toolResponse.result) {
      log(colors.green, '   ✅ Success!')
      const content = toolResponse.result.content?.[0]?.text
      if (content) {
        const preview = content.substring(0, 300)
        log(colors.blue, `   Result preview: ${preview}...`)
      }
      return true
    }

    log(colors.red, '   ❌ No response received')
    if (stderr) {
      log(colors.yellow, '   Stderr:', stderr.substring(0, 500))
    }
    return false
  } catch (error) {
    log(colors.red, '   ❌ Exception:', error.message)
    return false
  }
}

async function runTests() {
  log(colors.green, '\n🧪 MCP Tools Integration Test')
  log(colors.green, '============================\n')

  const now = Math.floor(Date.now() / 1000)
  const oneHourAgo = now - 3600

  const tests = [
    {
      name: 'list_service_definitions',
      description: 'List service definitions (no params needed)',
      args: { page_size: 5 },
    },
    {
      name: 'get_service_stats_realtime',
      description: 'Get real-time stats with relative time',
      args: { service: 'agent-api', from: 'now-1h', to: 'now' },
    },
    {
      name: 'get_service_stats_realtime',
      description: 'Get real-time stats with Unix timestamps',
      args: { service: 'agent-api', from: oneHourAgo, to: now },
    },
    {
      name: 'get_service_endpoints',
      description: 'Get service endpoints',
      args: { service: 'agent-api', from: oneHourAgo, to: now, limit: 5 },
    },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    const result = await testTool(test.name, test.description, test.args)
    if (result) {
      passed++
    } else {
      failed++
    }
  }

  log(colors.green, `\n\n✨ Test Summary`)
  log(colors.green, `================`)
  log(colors.green, `✅ Passed: ${passed}`)
  if (failed > 0) {
    log(colors.red, `❌ Failed: ${failed}`)
  }
  log(colors.cyan, `📊 Total:  ${passed + failed}\n`)

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  log(colors.red, '❌ Fatal error:', error)
  process.exit(1)
})
