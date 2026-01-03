import { z } from 'zod'

export const ListTracesZodSchema = z
  .object({
    query: z
      .string()
      .max(10000)
      .describe('Datadog APM trace query string (max 10000 chars)'),
    from: z.number().int().min(0).describe('Start time in epoch seconds'),
    to: z.number().int().min(0).describe('End time in epoch seconds'),
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
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })
  .refine((data) => data.to - data.from <= 86400 * 90, {
    message: 'Time range cannot exceed 90 days',
  })

export type ListTracesArgs = z.infer<typeof ListTracesZodSchema>
