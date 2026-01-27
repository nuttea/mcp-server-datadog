import { z } from 'zod'

export const ListTracesZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .describe('Datadog APM trace query string (max 10000 chars)'),
    from: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'Start time as Unix timestamp in seconds OR relative time string. Examples: 1737504000 or "now-1h" (defaults to 1 hour ago)',
      ),
    to: z
      .union([z.number().int().min(0), z.string()])
      .describe(
        'End time as Unix timestamp in seconds OR relative time string. Examples: 1737590400 or "now" (defaults to now)',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .default(100)
      .describe('Maximum number of traces to return (1-1000, default: 100)'),
    sort: z
      .enum(['timestamp', '-timestamp'])
      .optional()
      .default('-timestamp')
      .describe('Sort order for traces'),
    service: z
      .string()
      .max(255)
      .optional()
      .describe('Filter by service name (max 255 chars)'),
    operation: z
      .string()
      .max(255)
      .optional()
      .describe('Filter by operation name (max 255 chars)'),
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

export type ListTracesArgs = z.infer<typeof ListTracesZodSchema>
