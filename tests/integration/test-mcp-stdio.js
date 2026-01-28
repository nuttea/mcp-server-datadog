/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '../../.env' })
const { spawn } = require('child_process')

const proc = spawn('node', ['../../build/index.js'], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'inherit'],
})

let output = ''
let receivedResponse = false

proc.stdout.on('data', (data) => {
  output += data.toString()
  try {
    const messages = output.split('\n').filter((line) => line.trim())
    for (const msg of messages) {
      if (msg.includes('"result"') || msg.includes('"tools"')) {
        console.log('✅ MCP Server Response:', msg.substring(0, 200) + '...')
        receivedResponse = true
        proc.kill()
        process.exit(0)
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
})

// Test tools/list
setTimeout(() => {
  proc.stdin.write('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n')
}, 500)

setTimeout(() => {
  if (!receivedResponse) {
    console.log('❌ No response received')
    proc.kill()
    process.exit(1)
  }
}, 5000)

proc.on('error', (err) => {
  console.error('❌ Process error:', err)
  process.exit(1)
})
