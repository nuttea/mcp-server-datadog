import { z } from 'zod'

/**
 * Schema for listing Service Level Objectives (SLOs)
 */
export const ListSLOsZodSchema = z.object({
  tags: z
    .array(z.string().max(255))
    .optional()
    .describe('Filter SLOs by tags (each tag max 255 chars)'),
  query: z
    .string()
    .max(1000)
    .optional()
    .describe('Search query for SLO names (max 1000 chars)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .default(100)
    .describe('Maximum number of SLOs to return (1-1000, default: 100)'),
})

/**
 * Schema for getting a specific SLO
 */
export const GetSLOZodSchema = z.object({
  sloId: z.string().max(100).describe('SLO ID (max 100 chars)'),
  withConfiguredAlertIds: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include configured alert IDs in response'),
})

/**
 * Schema for getting SLO history over time
 */
export const GetSLOHistoryZodSchema = z
  .object({
    sloId: z.string().max(100).describe('SLO ID (max 100 chars)'),
    from: z
      .number()
      .int()
      .min(0)
      .describe(
        'Start time in epoch seconds (defaults to 30 days ago if not provided)',
      ),
    to: z
      .number()
      .int()
      .min(0)
      .describe('End time in epoch seconds (defaults to now if not provided)'),
    target: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe('Target threshold for SLO (0-100)'),
  })
  .refine((data) => data.to > data.from, {
    message: 'End time must be after start time',
  })

export type ListSLOsArgs = z.infer<typeof ListSLOsZodSchema>
export type GetSLOArgs = z.infer<typeof GetSLOZodSchema>
export type GetSLOHistoryArgs = z.infer<typeof GetSLOHistoryZodSchema>
