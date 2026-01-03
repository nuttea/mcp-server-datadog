import { describe, it, expect } from 'vitest'
import {
  CreateNotebookSchema,
  ListNotebooksSchema,
  GetNotebookSchema,
  UpdateNotebookSchema,
  DeleteNotebookSchema,
} from '../../src/tools/notebooks/schema.js'

describe('Notebooks Schema', () => {
  describe('CreateNotebookSchema', () => {
    it('should accept valid notebook creation', () => {
      const valid = {
        name: 'My Assessment Report',
        content: '# Report\n\nThis is my report content.',
        tags: ['team:sre', 'assessment'],
        time_live_span: '1d',
      }
      const result = CreateNotebookSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should require name and content', () => {
      const invalid = { tags: ['test'] }
      const result = CreateNotebookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should default time_live_span to 1h', () => {
      const input = {
        name: 'Test',
        content: 'Content',
      }
      const result = CreateNotebookSchema.parse(input)
      expect(result.time_live_span).toBe('1h')
    })
  })

  describe('ListNotebooksSchema', () => {
    it('should accept valid list parameters', () => {
      const valid = {
        author_handle: 'user@example.com',
        count: 50,
        sort_field: 'modified_at',
        sort_dir: 'desc',
      }
      const result = ListNotebooksSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should use defaults for optional fields', () => {
      const input = {}
      const result = ListNotebooksSchema.parse(input)
      expect(result.start).toBe(0)
      expect(result.count).toBe(100)
      expect(result.sort_field).toBe('modified_at')
      expect(result.sort_dir).toBe('desc')
      expect(result.include_cells).toBe(false)
    })

    it('should enforce max count of 1000', () => {
      const invalid = { count: 2000 }
      const result = ListNotebooksSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('GetNotebookSchema', () => {
    it('should accept valid notebook ID', () => {
      const valid = { notebook_id: 12345 }
      const result = GetNotebookSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should reject negative IDs', () => {
      const invalid = { notebook_id: -1 }
      const result = GetNotebookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should require notebook_id', () => {
      const invalid = {}
      const result = GetNotebookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateNotebookSchema', () => {
    it('should accept valid update', () => {
      const valid = {
        notebook_id: 12345,
        name: 'Updated Name',
        content: '# Updated Content',
        tags: ['updated'],
        status: 'published',
      }
      const result = UpdateNotebookSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should require only notebook_id', () => {
      const minimal = { notebook_id: 12345 }
      const result = UpdateNotebookSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should enforce valid status values', () => {
      const invalid = { notebook_id: 12345, status: 'invalid' }
      const result = UpdateNotebookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('DeleteNotebookSchema', () => {
    it('should accept valid notebook ID', () => {
      const valid = { notebook_id: 12345 }
      const result = DeleteNotebookSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('should require notebook_id', () => {
      const invalid = {}
      const result = DeleteNotebookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })
})
