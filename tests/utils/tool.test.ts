import { describe, it, expect } from 'vitest'
import { createToolSchema } from '../../src/utils/tool'
import { z } from 'zod'

describe('createToolSchema', () => {
  it('should generate tool schema with correct structure', () => {
    // Create a dummy schema
    const dummySchema = z.object({
      foo: z.string().describe('foo description'),
      bar: z.number().describe('bar description').optional(),
    })

    // Call createToolSchema
    const gotTool = createToolSchema(
      dummySchema,
      'test',
      'dummy test description',
    )

    // Verify basic structure
    expect(gotTool.name).toBe('test')
    expect(gotTool.description).toBe('dummy test description')
    expect(gotTool.inputSchema).toBeDefined()

    // The inputSchema should be a valid JSON Schema object
    // Exact structure may vary based on zod-to-json-schema version
    expect(typeof gotTool.inputSchema).toBe('object')
    expect(gotTool.inputSchema).toHaveProperty('type')
  })
})
