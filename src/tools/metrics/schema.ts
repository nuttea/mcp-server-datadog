import { z } from 'zod'

/**
 * Schema for querying metric timeseries data from Datadog
 * Supports aggregations, filtering, grouping, and formulas
 * Format: aggregation:metric.name{filter} [by {tag}].function()
 */
export const QueryMetricsZodSchema = z
  .object({
    query: z
      .string()
      .min(3)
      .max(10000)
      .describe(
        'Metric query in format: aggregation:metric.name{filter}. ' +
          'Examples: "avg:system.cpu.user{*}", "sum:trace.servlet.request.hits{service:my-service} by {env}", "avg:redis.net.clients{*}.rollup(avg, 60)". ' +
          'Common aggregations: avg, sum, min, max, count. ' +
          'Common metrics: system.cpu.user, system.load.1, trace.*.hits, docker.cpu.usage. ' +
          'See: https://docs.datadoghq.com/dashboards/querying/',
      ),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time. Formats: Unix seconds (1737504000), relative ("now-7d", "now-1h"), or ISO-8601 ("2026-01-27T00:00:00Z"). ' +
          'For trend analysis, use 7-30 day windows. Default: 1 hour ago',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time. Formats: Unix seconds (1737590400), relative ("now"), or ISO-8601. Default: now',
      ),
  })
  .refine(
    (data) => {
      // Only validate time order if both are numbers
      if (typeof data.to === 'number' && typeof data.from === 'number') {
        return data.to > data.from
      }
      return true
    },
    {
      message: 'End time must be after start time',
    },
  )
  .refine(
    (data) => {
      // Only validate range if both are numbers
      if (typeof data.to === 'number' && typeof data.from === 'number') {
        return data.to - data.from <= 86400 * 90
      }
      return true
    },
    {
      message: 'Time range cannot exceed 90 days',
    },
  )

export type QueryMetricsArgs = z.infer<typeof QueryMetricsZodSchema>
