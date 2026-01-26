#!/usr/bin/env node

/**
 * Integration test script for APM tools
 * Tests the actual MCP tools with real API calls
 */

import { createAPMToolHandlers } from './build/index.js'
import { v2, v1, client } from '@datadog/datadog-api-client'

// Configure Datadog client
const configuration = client.createConfiguration()

const spansApi = new v2.SpansApi(configuration)
const metricsApi = new v1.MetricsApi(configuration)
const serviceDefApi = new v2.ServiceDefinitionApi(configuration)

// Create handlers
const handlers = createAPMToolHandlers(spansApi, metricsApi, serviceDefApi)

// Test get_service_stats_realtime
async function testServiceStatsRealtime() {
  console.log('\n=== Testing get_service_stats_realtime ===')

  const now = Math.floor(Date.now() / 1000)
  const oneHourAgo = now - 3600

  try {
    const result = await handlers.get_service_stats_realtime({
      method: 'tools/call',
      params: {
        name: 'get_service_stats_realtime',
        arguments: {
          service: 'agent-api',
          from: oneHourAgo,
          to: now,
        },
      },
    })
    console.log('✅ Success:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Test get_service_endpoints
async function testServiceEndpoints() {
  console.log('\n=== Testing get_service_endpoints ===')

  const now = Math.floor(Date.now() / 1000)
  const oneHourAgo = now - 3600

  try {
    const result = await handlers.get_service_endpoints({
      method: 'tools/call',
      params: {
        name: 'get_service_endpoints',
        arguments: {
          service: 'agent-api',
          from: oneHourAgo,
          to: now,
          limit: 10,
        },
      },
    })
    console.log('✅ Success:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Test with relative time strings
async function testServiceStatsRealtimeRelative() {
  console.log(
    '\n=== Testing get_service_stats_realtime with relative times ===',
  )

  try {
    const result = await handlers.get_service_stats_realtime({
      method: 'tools/call',
      params: {
        name: 'get_service_stats_realtime',
        arguments: {
          service: 'agent-api',
          from: 'now-1h',
          to: 'now',
        },
      },
    })
    console.log('✅ Success:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run all tests
async function runTests() {
  console.log('Starting APM Tools Integration Tests...')
  console.log('Using service: agent-api')

  await testServiceStatsRealtime()
  await testServiceEndpoints()
  await testServiceStatsRealtimeRelative()

  console.log('\n✨ All tests completed!')
}

runTests().catch(console.error)
