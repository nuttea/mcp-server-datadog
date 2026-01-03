import { z } from 'zod'

/**
 * Datadog Notebooks API Schemas
 * https://docs.datadoghq.com/api/latest/notebooks/
 */

// Notebook cell types
export const NotebookCellTypeSchema = z.enum([
  'markdown',
  'timeseries',
  'toplist',
  'heatmap',
  'distribution',
  'log_stream',
])

// Markdown cell
export const MarkdownCellSchema = z.object({
  type: z.literal('markdown'),
  attributes: z.object({
    definition: z.object({
      type: z.literal('markdown'),
      text: z.string().describe('Markdown content'),
    }),
  }),
})

// Create Notebook Request
export const CreateNotebookSchema = z.object({
  name: z.string().min(1).max(200).describe('Notebook name'),

  content: z.string().describe('Markdown content for the notebook'),

  tags: z
    .array(z.string())
    .optional()
    .describe(
      'Tags to categorize the notebook (e.g., ["team:sre", "assessment"])',
    ),

  time_live_span: z
    .string()
    .optional()
    .default('1h')
    .describe('Default timeframe for time-based widgets (1h, 4h, 1d, 1w, 1mo)'),

  notify_list: z
    .array(z.string())
    .optional()
    .describe(
      'List of handles to notify when notebook is modified (e.g., ["@user@example.com"])',
    ),
})

export type CreateNotebookInput = z.infer<typeof CreateNotebookSchema>

// List Notebooks Request
export const ListNotebooksSchema = z.object({
  author_handle: z.string().optional().describe('Filter by author handle'),

  exclude_author_handle: z
    .string()
    .optional()
    .describe('Exclude notebooks by author handle'),

  start: z.number().optional().default(0).describe('Pagination offset'),

  count: z
    .number()
    .max(1000)
    .optional()
    .default(100)
    .describe('Number of notebooks to return (max 1000)'),

  sort_field: z
    .enum(['name', 'created', 'modified_at'])
    .optional()
    .default('modified_at')
    .describe('Field to sort by'),

  sort_dir: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort direction'),

  query: z.string().optional().describe('Search query to filter notebooks'),

  include_cells: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include full cell content in response'),
})

export type ListNotebooksInput = z.infer<typeof ListNotebooksSchema>

// Get Notebook Request
export const GetNotebookSchema = z.object({
  notebook_id: z.number().positive().describe('Notebook ID to retrieve'),
})

export type GetNotebookInput = z.infer<typeof GetNotebookSchema>

// Update Notebook Request
export const UpdateNotebookSchema = z.object({
  notebook_id: z.number().positive().describe('Notebook ID to update'),

  name: z.string().min(1).max(200).optional().describe('New notebook name'),

  content: z.string().optional().describe('New markdown content'),

  tags: z.array(z.string()).optional().describe('Updated tags'),

  status: z
    .enum(['published', 'unpublished'])
    .optional()
    .describe('Publication status'),
})

export type UpdateNotebookInput = z.infer<typeof UpdateNotebookSchema>

// Delete Notebook Request
export const DeleteNotebookSchema = z.object({
  notebook_id: z.number().positive().describe('Notebook ID to delete'),
})

export type DeleteNotebookInput = z.infer<typeof DeleteNotebookSchema>
