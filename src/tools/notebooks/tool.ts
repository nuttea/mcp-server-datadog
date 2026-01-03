import { ToolHandlers } from '../../types.js'
import { parseWithWarnings } from '../../utils/validation.js'
import { withRetry } from '../../utils/retry.js'
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
} from './schema.js'

/**
 * Datadog Notebooks Tool Handlers
 * https://docs.datadoghq.com/api/latest/notebooks/
 */

export const createHandlers = (api: v1.NotebooksApi): ToolHandlers => ({
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

    const notebookData = {
      data: {
        type: 'notebooks',
        attributes: {
          name: params.name,
          cells,
          time: {
            liveSpan: params.time_live_span || '1h',
          },
          ...(params.tags && { tags: params.tags }),
          ...(params.notify_list && { notify_list: params.notify_list }),
          status: 'published',
        },
      },
    }

    const result = await withRetry(() =>
      api.createNotebook({ body: notebookData }),
    )

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
              tags: notebook.attributes.tags || [],
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
      pageSize: params.count,
      pageOffset: params.start,
    }

    if (params.author_handle) queryParams.author_handle = params.author_handle
    if (params.exclude_author_handle)
      queryParams.exclude_author_handle = params.exclude_author_handle
    if (params.sort_field) queryParams.sort_field = params.sort_field
    if (params.sort_dir) queryParams.sort_dir = params.sort_dir
    if (params.query) queryParams.query = params.query
    if (params.include_cells) queryParams.include_cells = params.include_cells

    const result = await withRetry(() => api.listNotebooks(queryParams))

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
      tags: nb.attributes.tags || [],
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
              total: result.meta?.total || notebooks.length,
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
              tags: notebook.attributes.tags || [],
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

    // Merge updates with existing data
    const updateData: v1.NotebookUpdateRequest = {
      data: {
        type: 'notebooks',
        attributes: {
          ...existing.data.attributes,
          name: params.name || existing.data.attributes.name,
          cells: existing.data.attributes.cells,
        },
      },
    }

    if (params.name) updateData.data.attributes.name = params.name
    if (params.tags) updateData.data.attributes.tags = params.tags
    if (params.status) updateData.data.attributes.status = params.status
    if (params.content) {
      updateData.data.attributes.cells = convertMarkdownToCells(params.content)
    }

    const result = await withRetry(() =>
      api.updateNotebook({ notebookId: params.notebook_id, body: updateData }),
    )

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
  content: string,
): v1.NotebookCellCreateRequest[] {
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
