import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { parseWithWarnings } from '../../utils/validation'
import { withRetry } from '../../utils/retry'
import { createToolSchema } from '../../utils/tool'
import { v1 } from '@datadog/datadog-api-client'
import {
  CreateNotebookSchema,
  ListNotebooksSchema,
  GetNotebookSchema,
  UpdateNotebookSchema,
  DeleteNotebookSchema,
  type CreateNotebookInput,
  type ListNotebooksInput,
  type GetNotebookInput,
  type UpdateNotebookInput,
  type DeleteNotebookInput,
} from './schema'

/**
 * Datadog Notebooks Tool Handlers
 * https://docs.datadoghq.com/api/latest/notebooks/
 */

type NotebooksToolName =
  | 'create_notebook'
  | 'list_notebooks'
  | 'get_notebook'
  | 'update_notebook'
  | 'delete_notebook'
type NotebooksTool = ExtendedTool<NotebooksToolName>

export const NOTEBOOKS_TOOLS: NotebooksTool[] = [
  createToolSchema(
    CreateNotebookSchema,
    'create_notebook',
    'Create a new Datadog Notebook from markdown content',
  ),
  createToolSchema(
    ListNotebooksSchema,
    'list_notebooks',
    'List all Datadog Notebooks with optional filtering',
  ),
  createToolSchema(
    GetNotebookSchema,
    'get_notebook',
    'Get a specific Datadog Notebook by ID',
  ),
  createToolSchema(
    UpdateNotebookSchema,
    'update_notebook',
    'Update an existing Datadog Notebook (name, content, tags, status)',
  ),
  createToolSchema(
    DeleteNotebookSchema,
    'delete_notebook',
    'Delete a Datadog Notebook by ID',
  ),
] as const

type NotebooksToolHandlers = ToolHandlers<NotebooksToolName>

export const createNotebooksToolHandlers = (
  api: v1.NotebooksApi,
): NotebooksToolHandlers => ({
  /**
   * Create a new Datadog Notebook
   */
  create_notebook: async (request) => {
    const params = parseWithWarnings<CreateNotebookInput>(
      CreateNotebookSchema,
      request.params.arguments,
      'create_notebook',
    )

    // Convert markdown content to notebook cells
    const cells = convertMarkdownToCells(params.content)

    const notebookData: v1.NotebookCreateRequest = {
      data: {
        type: 'notebooks' as v1.NotebookResourceType,
        attributes: {
          name: params.name,
          cells,
          time: {
            liveSpan: (params.time_live_span || '1h') as v1.WidgetLiveSpan,
          },
          ...(params.tags && { tags: params.tags }),
          ...(params.notify_list && { notifyList: params.notify_list }),
          status: 'published' as v1.NotebookStatus,
        },
      },
    }

    const result = await withRetry(() =>
      api.createNotebook({ body: notebookData }),
    )

    if (!result.data) {
      throw new Error('No notebook data returned')
    }

    const notebook = result.data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: notebook.id,
              name: notebook.attributes.name,
              url: `https://app.${process.env.DATADOG_SITE || 'datadoghq.com'}/notebook/${notebook.id}`,
              created: notebook.attributes.created,
              modified: notebook.attributes.modified,
              status: notebook.attributes.status,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tags: (notebook.attributes as any).tags || [],
            },
            null,
            2,
          ),
        },
      ],
    }
  },

  /**
   * List all Datadog Notebooks
   */
  list_notebooks: async (request) => {
    const params = parseWithWarnings<ListNotebooksInput>(
      ListNotebooksSchema,
      request.params.arguments,
      'list_notebooks',
    )

    const queryParams: v1.NotebooksApiListNotebooksRequest = {
      count: params.count,
      start: params.start,
    }

    if (params.author_handle) queryParams.authorHandle = params.author_handle
    if (params.exclude_author_handle)
      queryParams.excludeAuthorHandle = params.exclude_author_handle
    if (params.sort_field) queryParams.sortField = params.sort_field
    if (params.sort_dir) queryParams.sortDir = params.sort_dir
    if (params.query) queryParams.query = params.query
    if (params.include_cells) queryParams.includeCells = params.include_cells

    const result = await withRetry(() => api.listNotebooks(queryParams))

    if (!result.data) {
      throw new Error('No notebooks data returned')
    }

    const notebooks = result.data.map((nb) => ({
      id: nb.id,
      name: nb.attributes.name,
      author: {
        name: nb.attributes.author?.name,
        handle: nb.attributes.author?.handle,
      },
      created: nb.attributes.created,
      modified: nb.attributes.modified,
      status: nb.attributes.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: (nb.attributes as any).tags || [],
      url: `https://app.${process.env.DATADOG_SITE || 'datadoghq.com'}/notebook/${nb.id}`,
      ...(params.include_cells && {
        cell_count: nb.attributes.cells?.length || 0,
      }),
    }))

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              total: (result.meta as any)?.total || notebooks.length,
              count: notebooks.length,
              notebooks,
            },
            null,
            2,
          ),
        },
      ],
    }
  },

  /**
   * Get a specific Datadog Notebook
   */
  get_notebook: async (request) => {
    const params = parseWithWarnings<GetNotebookInput>(
      GetNotebookSchema,
      request.params.arguments,
      'get_notebook',
    )

    const result = await withRetry(() =>
      api.getNotebook({ notebookId: params.notebook_id }),
    )

    if (!result.data) {
      throw new Error('No notebook data returned')
    }

    const notebook = result.data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: notebook.id,
              name: notebook.attributes.name,
              author: notebook.attributes.author,
              created: notebook.attributes.created,
              modified: notebook.attributes.modified,
              status: notebook.attributes.status,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tags: (notebook.attributes as any).tags || [],
              cells: notebook.attributes.cells || [],
              time: notebook.attributes.time,
              url: `https://app.${process.env.DATADOG_SITE || 'datadoghq.com'}/notebook/${notebook.id}`,
            },
            null,
            2,
          ),
        },
      ],
    }
  },

  /**
   * Update an existing Datadog Notebook
   */
  update_notebook: async (request) => {
    const params = parseWithWarnings<UpdateNotebookInput>(
      UpdateNotebookSchema,
      request.params.arguments,
      'update_notebook',
    )

    // First, get the existing notebook
    const existing = await withRetry(() =>
      api.getNotebook({ notebookId: params.notebook_id }),
    )

    if (!existing.data) {
      throw new Error('No existing notebook data returned')
    }

    // Merge updates with existing data
    const updateData: v1.NotebookUpdateRequest = {
      data: {
        type: 'notebooks' as v1.NotebookResourceType,
        attributes: {
          ...existing.data.attributes,
          name: params.name || existing.data.attributes.name,
          cells: existing.data.attributes.cells,
        },
      },
    }

    if (params.name) updateData.data.attributes.name = params.name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (params.tags) (updateData.data.attributes as any).tags = params.tags
    if (params.status)
      updateData.data.attributes.status = params.status as v1.NotebookStatus
    if (params.content) {
      updateData.data.attributes.cells = convertMarkdownToCells(params.content)
    }

    const result = await withRetry(() =>
      api.updateNotebook({ notebookId: params.notebook_id, body: updateData }),
    )

    if (!result.data) {
      throw new Error('No updated notebook data returned')
    }

    const notebook = result.data
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: notebook.id,
              name: notebook.attributes.name,
              modified: notebook.attributes.modified,
              status: notebook.attributes.status,
              url: `https://app.${process.env.DATADOG_SITE || 'datadoghq.com'}/notebook/${notebook.id}`,
              message: 'Notebook updated successfully',
            },
            null,
            2,
          ),
        },
      ],
    }
  },

  /**
   * Delete a Datadog Notebook
   */
  delete_notebook: async (request) => {
    const params = parseWithWarnings<DeleteNotebookInput>(
      DeleteNotebookSchema,
      request.params.arguments,
      'delete_notebook',
    )

    await withRetry(() =>
      api.deleteNotebook({ notebookId: params.notebook_id }),
    )

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              notebook_id: params.notebook_id,
              message: 'Notebook deleted successfully',
            },
            null,
            2,
          ),
        },
      ],
    }
  },
})

/**
 * Helper: Convert markdown content to Datadog notebook cells
 * Splits by headers and creates markdown cells
 */
function convertMarkdownToCells(
  content: string | undefined,
): v1.NotebookCellCreateRequest[] {
  // Handle undefined or empty content
  if (!content || typeof content !== 'string') {
    throw new Error(
      'Content is required and must be a string. Received: ' + typeof content,
    )
  }

  const cells: v1.NotebookCellCreateRequest[] = []

  // Split content by top-level headers (# Header)
  const sections = content.split(/(?=^# )/gm).filter((s) => s.trim())

  if (sections.length === 0) {
    // No headers found, create single cell with all content
    return [
      {
        type: 'notebook_cells',
        attributes: {
          definition: {
            type: 'markdown',
            text: content.trim(),
          },
        },
      },
    ]
  }

  // Create a cell for each section
  sections.forEach((section) => {
    const trimmed = section.trim()
    if (trimmed) {
      cells.push({
        type: 'notebook_cells',
        attributes: {
          definition: {
            type: 'markdown',
            text: trimmed,
          },
        },
      })
    }
  })

  return cells
}
