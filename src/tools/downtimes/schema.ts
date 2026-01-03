import { z } from 'zod'

export const ListDowntimesZodSchema = z.object({
  currentOnly: z
    .boolean()
    .optional()
    .describe('Only return currently active downtimes'),
})

export const ScheduleDowntimeZodSchema = z.object({
  scope: z
    .string()
    .max(500)
    .nonempty()
    .describe('Scope for downtime (max 500 chars, e.g., "host:my-host")'),
  start: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('UNIX timestamp for start time'),
  end: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('UNIX timestamp for end time'),
  message: z
    .string()
    .max(5000)
    .optional()
    .describe('Message for downtime (max 5000 chars)'),
  timezone: z
    .string()
    .max(100)
    .optional()
    .describe('Timezone (max 100 chars, e.g., "UTC", "America/New_York")'),
  monitorId: z.number().int().optional().describe('Monitor ID to mute'),
  monitorTags: z
    .array(z.string().max(255))
    .optional()
    .describe('Monitor tags (each max 255 chars)'),
  recurrence: z
    .object({
      type: z.enum(['days', 'weeks', 'months', 'years']),
      period: z.number().int().min(1).describe('Recurrence period (min: 1)'),
      weekDays: z
        .array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))
        .optional(),
      until: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('UNIX timestamp for recurrence end'),
    })
    .optional(),
})

export const CancelDowntimeZodSchema = z.object({
  downtimeId: z.number().int().describe('Downtime ID to cancel'),
})
