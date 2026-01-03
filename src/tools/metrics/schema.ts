import { z } from 'zod'

export const QueryMetricsZodSchema = z
  .object({
    from: z
      .number()
      .int()
      .min(0)
      .describe(
        'Start of the queried time period, seconds since the Unix epoch.',
      ),
    to: z
      .number()
      .int()
      .min(0)
      .describe(
        'End of the queried time period, seconds since the Unix epoch.',
      ),
    query: z
      .string()
      .max(10000)
      .describe(
        'Datadog metrics query string (max 10000 chars). e.g. "avg:system.cpu.user{*}"',
      ),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })

export type QueryMetricsArgs = z.infer<typeof QueryMetricsZodSchema>
