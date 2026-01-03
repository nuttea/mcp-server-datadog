import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseWithWarnings } from '../../src/utils/validation'
import { z } from 'zod'
import * as helperModule from '../../src/utils/helper'

// Mock the log function to capture logging output
vi.mock('../../src/utils/helper', async () => {
  const actual = await vi.importActual('../../src/utils/helper')
  return {
    ...actual,
    log: vi.fn(),
  }
})

describe('Validation Utility', () => {
  const mockLog = vi.mocked(helperModule.log)

  beforeEach(() => {
    mockLog.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('parseWithWarnings', () => {
    describe('Valid Data', () => {
      it('should parse valid data without warnings', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        })

        const data = { name: 'John', age: 30 }
        const result = parseWithWarnings(schema, data, 'test_tool')

        expect(result).toEqual(data)
        expect(mockLog).not.toHaveBeenCalled()
      })

      it('should apply schema defaults for valid data', () => {
        const schema = z.object({
          name: z.string(),
          active: z.boolean().default(true),
        })

        const data = { name: 'Test' }
        const result = parseWithWarnings(schema, data, 'test_tool')

        expect(result).toEqual({ name: 'Test', active: true })
        expect(mockLog).not.toHaveBeenCalled()
      })
    })

    describe('Invalid Data - Lenient Mode', () => {
      it('should log warnings but not throw for invalid data', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        })

        const invalidData = { name: 'John', age: 'thirty' }
        const result = parseWithWarnings(schema, invalidData, 'test_tool')

        // Should return data as-is despite being invalid
        expect(result).toEqual(invalidData)

        // Should have logged error
        expect(mockLog).toHaveBeenCalledWith(
          'error',
          'Validation warning in test_tool:',
          expect.any(String),
        )
      })

      it('should log individual field violations', () => {
        const schema = z.object({
          email: z.string().email(),
          age: z.number().min(0),
        })

        const invalidData = { email: 'not-an-email', age: -5 }
        parseWithWarnings(schema, invalidData, 'test_tool')

        // Should log errors for each invalid field
        const errorCalls = mockLog.mock.calls.filter(
          (call) => call[0] === 'error',
        )
        expect(errorCalls.length).toBeGreaterThan(0)
      })

      it('should log info about continuing with invalid data', () => {
        const schema = z.object({
          value: z.number(),
        })

        parseWithWarnings(schema, { value: 'string' }, 'test_tool')

        // Should log info about continuing
        expect(mockLog).toHaveBeenCalledWith(
          'info',
          expect.stringContaining('Continuing with potentially invalid data'),
        )
      })

      it('should handle missing required fields gracefully', () => {
        const schema = z.object({
          required: z.string(),
          optional: z.string().optional(),
        })

        const result = parseWithWarnings(schema, {}, 'test_tool')

        expect(result).toEqual({})
        expect(mockLog).toHaveBeenCalled()
      })
    })

    describe('Auto-fill Functionality', () => {
      it('should auto-fill time range for logs tools when from/to missing', () => {
        const schema = z.object({
          query: z.string().default('*'),
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(schema, {}, 'get_logs') as unknown as {
          from: number
          to: number
          query: string
        }

        // Should have auto-filled time range
        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
        expect(result.query).toBe('*')

        // from should be ~1 hour ago, to should be ~now
        const now = Math.floor(Date.now() / 1000)
        expect(result.to).toBeGreaterThanOrEqual(now - 5) // Within 5 seconds
        expect(result.to).toBeLessThanOrEqual(now + 5)
        expect(result.from).toBe(result.to - 3600) // Exactly 1 hour before

        // Should have logged auto-fill
        expect(mockLog).toHaveBeenCalledWith(
          'info',
          '[get_logs] Auto-filled time range: last 1 hour',
        )
      })

      it('should auto-fill for get_all_services tool', () => {
        const schema = z.object({
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(
          schema,
          {},
          'get_all_services',
        ) as unknown as {
          from: number
          to: number
        }

        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
        expect(mockLog).toHaveBeenCalledWith(
          'info',
          '[get_all_services] Auto-filled time range: last 1 hour',
        )
      })

      it('should auto-fill for RUM tools', () => {
        const schema = z.object({
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(
          schema,
          {},
          'get_rum_events',
        ) as unknown as {
          from: number
          to: number
        }

        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
      })

      it('should auto-fill for trace tools', () => {
        const schema = z.object({
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(
          schema,
          {},
          'list_traces',
        ) as unknown as {
          from: number
          to: number
        }

        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
      })

      it('should auto-fill for metrics tools', () => {
        const schema = z.object({
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(
          schema,
          {},
          'query_metrics',
        ) as unknown as {
          from: number
          to: number
        }

        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
      })

      it('should NOT auto-fill if from/to are provided', () => {
        const schema = z.object({
          from: z.number(),
          to: z.number(),
        })

        const providedData = { from: 1000000, to: 2000000 }
        const result = parseWithWarnings(
          schema,
          providedData,
          'get_logs',
        ) as unknown as {
          from: number
          to: number
        }

        // Should use provided values, not auto-fill
        expect(result.from).toBe(1000000)
        expect(result.to).toBe(2000000)

        // Should not have logged auto-fill
        const autoFillCalls = mockLog.mock.calls.filter((call) =>
          call.some((arg) => String(arg).includes('Auto-filled')),
        )
        expect(autoFillCalls.length).toBe(0)
      })

      it('should NOT auto-fill for tools that do not need time ranges', () => {
        const schema = z.object({
          id: z.string(),
        })

        parseWithWarnings(schema, {}, 'get_incident')

        // Should not have auto-filled anything
        const autoFillCalls = mockLog.mock.calls.filter((call) =>
          call.some((arg) => String(arg).includes('Auto-filled')),
        )
        expect(autoFillCalls.length).toBe(0)
      })

      it('should preserve existing query when auto-filling', () => {
        const schema = z.object({
          query: z.string(),
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(
          schema,
          { query: 'service:my-app' },
          'get_logs',
        ) as unknown as {
          query: string
          from: number
          to: number
        }

        expect(result.query).toBe('service:my-app')
        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
      })

      it('should add default query when missing during auto-fill', () => {
        const schema = z.object({
          query: z.string(),
          from: z.number(),
          to: z.number(),
        })

        const result = parseWithWarnings(schema, {}, 'get_logs') as unknown as {
          query: string
          from: number
          to: number
        }

        expect(result.query).toBe('*')
        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
      })
    })

    describe('Edge Cases', () => {
      it('should handle null data', () => {
        const schema = z.object({
          value: z.string(),
        })

        const result = parseWithWarnings(schema, null, 'test_tool')

        expect(result).toBeNull()
      })

      it('should handle undefined data', () => {
        const schema = z.object({
          value: z.string(),
        })

        const result = parseWithWarnings(schema, undefined, 'test_tool')

        expect(result).toBeUndefined()
      })

      it('should handle non-object data', () => {
        const schema = z.string()

        const result = parseWithWarnings(schema, 'test string', 'test_tool')

        expect(result).toBe('test string')
      })

      it('should handle arrays', () => {
        const schema = z.array(z.string())

        const data = ['a', 'b', 'c']
        const result = parseWithWarnings(schema, data, 'test_tool')

        expect(result).toEqual(data)
      })

      it('should handle nested objects', () => {
        const schema = z.object({
          user: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
        })

        const invalidData = {
          user: {
            name: 'John',
            email: 'not-an-email',
          },
        }

        const result = parseWithWarnings(schema, invalidData, 'test_tool')

        expect(result).toEqual(invalidData)
        expect(mockLog).toHaveBeenCalled()
      })
    })

    describe('Error Handling', () => {
      it('should handle ZodError with missing errors array', () => {
        const schema = z.object({
          value: z.string(),
        })

        // This shouldn't crash even if error.errors is undefined
        const result = parseWithWarnings(schema, { value: 123 }, 'test_tool')

        expect(result).toBeDefined()
        expect(mockLog).toHaveBeenCalled()
      })

      it('should handle non-ZodError exceptions gracefully', () => {
        // Create a schema that throws a non-Zod error
        const schema = z.any().transform(() => {
          throw new Error('Custom error')
        })

        const result = parseWithWarnings(schema, {}, 'test_tool')

        // Should return data as-is
        expect(result).toEqual({})
      })
    })

    describe('Integration with Real Schemas', () => {
      it('should work with GetLogsZodSchema pattern', () => {
        const GetLogsSchema = z.object({
          query: z.string().max(10000).default('*'),
          from: z.number().int().min(0),
          to: z.number().int().min(0),
          limit: z.number().int().min(1).max(1000).optional().default(100),
        })

        const result = parseWithWarnings(
          GetLogsSchema,
          {},
          'get_logs',
        ) as unknown as {
          query: string
          from: number
          to: number
          limit: number
        }

        expect(result.query).toBe('*')
        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
        expect(result.limit).toBe(100)

        // Verify time range is reasonable (last hour)
        const now = Math.floor(Date.now() / 1000)
        expect(result.to).toBeCloseTo(now, -1) // Within 10 seconds
        expect(result.from).toBe(result.to - 3600)
      })

      it('should work with partial data', () => {
        const schema = z.object({
          query: z.string().max(10000).default('*'),
          from: z.number().int().min(0),
          to: z.number().int().min(0),
          limit: z.number().int().min(1).max(1000).optional().default(100),
        })

        const partialData = { limit: 50 }
        const result = parseWithWarnings(
          schema,
          partialData,
          'get_logs',
        ) as unknown as {
          query: string
          from: number
          to: number
          limit: number
        }

        // Should preserve provided value and auto-fill missing ones
        expect(result.limit).toBe(50)
        expect(result.query).toBe('*')
        expect(result.from).toBeDefined()
        expect(result.to).toBeDefined()
      })
    })

    describe('Logging Behavior', () => {
      it('should log detailed error format on validation failure', () => {
        const schema = z.object({
          name: z.string().min(3),
          age: z.number().min(18),
        })

        parseWithWarnings(schema, { name: 'ab', age: 10 }, 'test_tool')

        // Should have logged error with formatted error
        expect(mockLog).toHaveBeenCalledWith(
          'error',
          'Validation warning in test_tool:',
          expect.stringContaining('name'),
        )
      })

      it('should log each field violation separately', () => {
        const schema = z.object({
          field1: z.string(),
          field2: z.number(),
          field3: z.boolean(),
        })

        parseWithWarnings(
          schema,
          { field1: 123, field2: 'abc', field3: 'xyz' },
          'test_tool',
        )

        // Should have logged error warnings
        const errorCalls = mockLog.mock.calls.filter(
          (call) => call[0] === 'error',
        )
        expect(errorCalls.length).toBeGreaterThan(0)
      })

      it('should include context in all log messages', () => {
        const schema = z.object({
          value: z.number(),
        })

        parseWithWarnings(schema, { value: 'string' }, 'my_custom_tool')

        // All log calls should reference the context
        const allCalls = mockLog.mock.calls
        const contexted = allCalls.filter((call) =>
          call.some((arg) => String(arg).includes('my_custom_tool')),
        )
        expect(contexted.length).toBeGreaterThan(0)
      })
    })

    describe('Performance', () => {
      it('should handle large objects efficiently', () => {
        const largeSchema = z.object({
          items: z.array(
            z.object({
              id: z.string(),
              value: z.number(),
            }),
          ),
        })

        const largeData = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: `item-${i}`,
            value: i,
          })),
        }

        const start = performance.now()
        const result = parseWithWarnings(largeSchema, largeData, 'test_tool')
        const duration = performance.now() - start

        expect(result).toEqual(largeData)
        expect(duration).toBeLessThan(100) // Should be fast
      })
    })

    describe('Type Safety', () => {
      it('should preserve TypeScript types from schema', () => {
        const schema = z.object({
          name: z.string(),
          count: z.number(),
        })

        type Expected = z.infer<typeof schema>

        const result: Expected = parseWithWarnings(
          schema,
          { name: 'test', count: 42 },
          'test_tool',
        )

        // TypeScript should infer correct types
        expect(typeof result.name).toBe('string')
        expect(typeof result.count).toBe('number')
      })
    })
  })
})
