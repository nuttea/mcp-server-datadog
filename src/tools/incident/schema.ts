import { z } from 'zod'

/**
 * Consolidated schema for incident operations
 * If incidentId provided: get specific incident
 * If not provided: list all incidents with pagination
 */
export const IncidentsZodSchema = z.object({
  incidentId: z
    .string()
    .max(100)
    .optional()
    .describe(
      'Incident ID - if provided, get specific incident; otherwise list all',
    ),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe('Page size for listing (1-100, default: 10)'),
  pageOffset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Page offset for listing (min: 0, default: 0)'),
})
