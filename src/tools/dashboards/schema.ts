import { z } from 'zod'

export const ListDashboardsZodSchema = z.object({
  name: z
    .string()
    .max(255)
    .optional()
    .describe('Filter dashboards by name (max 255 chars)'),
  tags: z
    .array(z.string().max(255))
    .optional()
    .describe('Filter dashboards by tags (each tag max 255 chars)'),
})

export const GetDashboardZodSchema = z.object({
  dashboardId: z.string().max(100).describe('Dashboard ID (max 100 chars)'),
})
