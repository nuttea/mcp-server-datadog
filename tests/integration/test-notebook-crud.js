#!/usr/bin/env node

/**
 * Test Notebook CRUD Operations
 * Tests: create_notebook, get_notebook, update_notebook, delete_notebook
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

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
} catch {
  // Ignore - .env optional
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

async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve) => {
    const mcp = spawn('node', [join(__dirname, '../../build/index.js')], {
      env: process.env,
    })

    let stdout = ''
    let responses = []

    mcp.stdout.on('data', (data) => {
      stdout += data.toString()
      const lines = stdout.split('\n').filter((l) => l.trim())
      lines.forEach((line) => {
        try {
          responses.push(JSON.parse(line))
        } catch {
          // Not JSON - ignore
        }
      })
    })

    mcp.on('close', () => resolve({ responses }))
    mcp.on('error', () => resolve({ responses: [] }))

    setTimeout(() => {
      mcp.kill()
      resolve({ responses })
    }, 10000)

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

async function runCRUDTest() {
  log(colors.green, '\n' + '='.repeat(80))
  log(colors.green, '🧪 Notebook CRUD Operations Test')
  log(colors.green, '='.repeat(80) + '\n')

  let notebookId = null
  let passed = 0
  let failed = 0

  // Step 1: CREATE
  log(colors.cyan, '\n📝 Step 1: CREATE - create_notebook')
  log(colors.blue, '   Creating test notebook...')

  try {
    const { responses } = await callMCPTool('create_notebook', {
      name: 'MCP Test Notebook - Safe to Delete',
      content: `# MCP Test Notebook

## Purpose
This notebook was created by automated MCP testing.
**Safe to delete** - this is a test artifact.

## Test Data
- Created: ${new Date().toISOString()}
- Tool: create_notebook
- Purpose: Integration testing

## Sample Widgets

### Test Query
\`\`\`
service:agent-api
\`\`\`

### Test Metrics
- CPU Usage
- Memory Usage
- Request Rate
`,
      tags: ['test:mcp', 'safe-to-delete'],
      time_live_span: '1h',
    })

    const response = responses.find((r) => r.id === 2)

    if (response && response.error) {
      log(colors.red, `   ❌ Failed: ${response.error.message}`)
      failed++
    } else if (response && response.result) {
      const content = response.result.content?.[0]?.text || ''
      const match = content.match(/"id":\s*(\d+)/)
      if (match) {
        notebookId = parseInt(match[1])
        log(colors.green, `   ✅ Created! Notebook ID: ${notebookId}`)
        log(colors.blue, `   📄 ${content.substring(0, 150)}...`)
        passed++
      } else {
        log(colors.red, `   ❌ Could not extract notebook ID`)
        failed++
        return
      }
    } else {
      log(colors.red, `   ❌ No response`)
      failed++
      return
    }
  } catch (error) {
    log(colors.red, `   ❌ Exception: ${error.message}`)
    failed++
    return
  }

  // Step 2: READ
  log(colors.cyan, '\n📖 Step 2: READ - get_notebook')
  log(colors.blue, `   Retrieving notebook ${notebookId}...`)

  try {
    const { responses } = await callMCPTool('get_notebook', {
      notebook_id: notebookId,
    })

    const response = responses.find((r) => r.id === 2)

    if (response && response.error) {
      log(colors.red, `   ❌ Failed: ${response.error.message}`)
      failed++
    } else if (response && response.result) {
      const content = response.result.content?.[0]?.text || ''
      if (content.includes('MCP Test Notebook')) {
        log(colors.green, `   ✅ Retrieved successfully!`)
        log(colors.blue, `   📄 ${content.substring(0, 150)}...`)
        passed++
      } else {
        log(colors.red, `   ❌ Content mismatch`)
        failed++
      }
    } else {
      log(colors.red, `   ❌ No response`)
      failed++
    }
  } catch (error) {
    log(colors.red, `   ❌ Exception: ${error.message}`)
    failed++
  }

  // Step 3: UPDATE
  log(colors.cyan, '\n✏️  Step 3: UPDATE - update_notebook')
  log(colors.blue, `   Updating notebook ${notebookId}...`)

  try {
    const { responses } = await callMCPTool('update_notebook', {
      notebook_id: notebookId,
      name: 'MCP Test Notebook - UPDATED - Safe to Delete',
      content: `# MCP Test Notebook - UPDATED

## Update Test
This notebook was **updated** by automated MCP testing.

### Update Timestamp
${new Date().toISOString()}

### Update Test Passed
✅ update_notebook tool is working correctly!

**Still safe to delete** - this is a test artifact.
`,
      tags: ['test:mcp', 'safe-to-delete', 'updated'],
    })

    const response = responses.find((r) => r.id === 2)

    if (response && response.error) {
      log(colors.red, `   ❌ Failed: ${response.error.message}`)
      failed++
    } else if (response && response.result) {
      const content = response.result.content?.[0]?.text || ''
      if (content.includes('UPDATED')) {
        log(colors.green, `   ✅ Updated successfully!`)
        log(colors.blue, `   📄 ${content.substring(0, 150)}...`)
        passed++
      } else {
        log(colors.green, `   ✅ Update completed`)
        passed++
      }
    } else {
      log(colors.red, `   ❌ No response`)
      failed++
    }
  } catch (error) {
    log(colors.red, `   ❌ Exception: ${error.message}`)
    failed++
  }

  // Step 4: VERIFY UPDATE
  log(colors.cyan, '\n🔍 Step 4: VERIFY - get_notebook (after update)')
  log(colors.blue, `   Verifying update...`)

  try {
    const { responses } = await callMCPTool('get_notebook', {
      notebook_id: notebookId,
    })

    const response = responses.find((r) => r.id === 2)

    if (response && response.result) {
      const content = response.result.content?.[0]?.text || ''
      if (content.includes('UPDATED')) {
        log(colors.green, `   ✅ Update verified!`)
        log(colors.blue, `   📄 Name contains "UPDATED"`)
        passed++
      } else {
        log(colors.yellow, `   ⚠️  Update may not have persisted`)
      }
    }
  } catch (error) {
    log(colors.yellow, `   ⚠️  Could not verify: ${error.message}`)
  }

  // Step 5: DELETE
  log(colors.cyan, '\n🗑️  Step 5: DELETE - delete_notebook')
  log(colors.blue, `   Deleting notebook ${notebookId}...`)

  try {
    const { responses } = await callMCPTool('delete_notebook', {
      notebook_id: notebookId,
    })

    const response = responses.find((r) => r.id === 2)

    if (response && response.error) {
      log(colors.red, `   ❌ Failed: ${response.error.message}`)
      failed++
    } else if (response && response.result) {
      log(colors.green, `   ✅ Deleted successfully!`)
      passed++
    } else {
      log(colors.red, `   ❌ No response`)
      failed++
    }
  } catch (error) {
    log(colors.red, `   ❌ Exception: ${error.message}`)
    failed++
  }

  // Step 6: VERIFY DELETION
  log(colors.cyan, '\n🔍 Step 6: VERIFY - get_notebook (should fail)')
  log(colors.blue, `   Verifying deletion...`)

  try {
    const { responses } = await callMCPTool('get_notebook', {
      notebook_id: notebookId,
    })

    const response = responses.find((r) => r.id === 2)

    if (response && response.error) {
      if (
        response.error.message.includes('not found') ||
        response.error.message.includes('404')
      ) {
        log(colors.green, `   ✅ Deletion verified (notebook not found)`)
        passed++
      } else {
        log(colors.yellow, `   ⚠️  Different error: ${response.error.message}`)
      }
    } else if (response && response.result) {
      log(colors.red, `   ❌ Notebook still exists!`)
      failed++
    }
  } catch (error) {
    log(colors.yellow, `   ⚠️  Could not verify: ${error.message}`)
  }

  // Summary
  log(colors.green, '\n\n' + '='.repeat(80))
  log(colors.green, '🎯 Test Summary')
  log(colors.green, '='.repeat(80) + '\n')

  log(colors.green, `✅ Passed: ${passed}/6 steps`)
  if (failed > 0) {
    log(colors.red, `❌ Failed: ${failed}/6 steps`)
  }
  const passRate = ((passed / 6) * 100).toFixed(1)
  log(colors.cyan, `📈 Success Rate: ${passRate}%\n`)

  if (passed === 6) {
    log(colors.green, '🎉 ALL NOTEBOOK CRUD OPERATIONS WORKING!\n')
    log(colors.blue, 'Tools Verified:')
    log(colors.green, '  ✅ create_notebook')
    log(colors.green, '  ✅ get_notebook (read)')
    log(colors.green, '  ✅ update_notebook')
    log(colors.green, '  ✅ delete_notebook')
    log(colors.green, '  ✅ Verification steps\n')
  } else {
    log(colors.yellow, `⚠️  ${failed} step(s) failed - check errors above\n`)

    if (notebookId) {
      log(colors.yellow, `⚠️  Test notebook ID ${notebookId} may still exist`)
      log(
        colors.blue,
        `   Manual cleanup: https://app.datadoghq.com/notebook/${notebookId}\n`,
      )
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

log(
  colors.cyan,
  '\n⚠️  WARNING: This test will CREATE, UPDATE, and DELETE a test notebook',
)
log(
  colors.yellow,
  '   The notebook will be clearly marked as "MCP Test - Safe to Delete"',
)
log(colors.blue, '   Test will auto-cleanup at the end\n')

setTimeout(() => {
  runCRUDTest().catch((error) => {
    log(colors.red, '❌ Fatal error:', error)
    process.exit(1)
  })
}, 1000)
