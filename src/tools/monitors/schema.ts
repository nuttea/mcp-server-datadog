import { z } from 'zod'

export const GetMonitorsZodSchema = z.object({
  groupStates: z
    .array(z.enum(['alert', 'warn', 'no data', 'ok']))
    .optional()
    .describe('Filter monitors by their states'),
  name: z
    .string()
    .max(255)
    .optional()
    .describe('Filter monitors by name (max 255 chars)'),
  tags: z
    .array(z.string().max(255))
    .optional()
    .describe('Filter monitors by tags (each tag max 255 chars)'),
})
