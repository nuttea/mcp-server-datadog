/**
 * Helper to discover all APM services from metrics
 * This matches what the Datadog UI shows in the APM Services page
 */

import { v1 } from '@datadog/datadog-api-client'
import { withRetry } from '../../utils/retry'

/**
 * Get all unique service names that have sent APM data
 * Queries the trace.*.hits metric to find all services
 *
 * @param metricsApi - Datadog Metrics API instance
 * @param timeframe - How far back to look (in seconds, default: 7 days)
 * @returns Set of service names
 */
export async function getAllAPMServices(
  metricsApi: v1.MetricsApi,
  timeframe: number = 604800, // 7 days default
): Promise<Set<string>> {
  const services = new Set<string>()
  const now = Math.floor(Date.now() / 1000)
  const from = now - timeframe

  try {
    // Query for all services that have sent traces
    // Use trace.*.hits metric to find active services
    const response = await withRetry(() =>
      metricsApi.queryMetrics({
        from,
        to: now,
        query: 'sum:trace.*.hits{*} by {service}.as_count()',
      }),
    )

    if (response.series) {
      for (const series of response.series) {
        // Extract service name from scope
        // Format: "service:my-service-name,..."
        const scope = series.scope || ''
        const serviceMatch = scope.match(/service:([^,}]+)/)
        if (serviceMatch && serviceMatch[1]) {
          services.add(serviceMatch[1])
        }
      }
    }
  } catch (error) {
    // APM metrics not available
    console.error('[getAllAPMServices] Error querying APM metrics:', error)
  }

  return services
}
