import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry, DEFAULT_RETRY_OPTIONS } from '../../src/utils/retry'

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('withRetry', () => {
    it('should return result on first try if operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await withRetry(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry and succeed after initial failure', async () => {
      const temporaryError = {
        response: { status: 500 },
        message: 'Temporary error',
      }
      const operation = vi
        .fn()
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValueOnce('success')

      const result = await withRetry(operation, { initialDelayMs: 10 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries are exhausted', async () => {
      const persistentError = {
        response: { status: 500 },
        message: 'Persistent error',
      }
      const operation = vi.fn().mockRejectedValue(persistentError)

      await expect(
        withRetry(operation, { maxRetries: 2, initialDelayMs: 10 }),
      ).rejects.toEqual(persistentError)

      // Initial attempt + 2 retries = 3 total calls
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should retry on rate limit error (429)', async () => {
      const rateLimitError = {
        response: { status: 429 },
        message: 'Rate limit exceeded',
      }
      const operation = vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('success')

      const result = await withRetry(operation, { initialDelayMs: 10 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should retry on server error (500)', async () => {
      const serverError = {
        response: { status: 500 },
        message: 'Internal server error',
      }
      const operation = vi
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce('success')

      const result = await withRetry(operation, { initialDelayMs: 10 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should retry on multiple server error codes (502, 503, 504)', async () => {
      for (const status of [502, 503, 504]) {
        const serverError = {
          response: { status },
          message: `Server error ${status}`,
        }
        const operation = vi
          .fn()
          .mockRejectedValueOnce(serverError)
          .mockResolvedValueOnce('success')

        const result = await withRetry(operation, { initialDelayMs: 10 })

        expect(result).toBe('success')
        expect(operation).toHaveBeenCalledTimes(2)
      }
    })

    it('should NOT retry on authentication error (403)', async () => {
      const authError = {
        response: { status: 403 },
        message: 'Authentication failed',
      }
      const operation = vi.fn().mockRejectedValue(authError)

      await expect(
        withRetry(operation, { initialDelayMs: 10 }),
      ).rejects.toEqual(authError)

      // Should only be called once (no retries)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should NOT retry on not found error (404)', async () => {
      const notFoundError = {
        response: { status: 404 },
        message: 'Not found',
      }
      const operation = vi.fn().mockRejectedValue(notFoundError)

      await expect(
        withRetry(operation, { initialDelayMs: 10 }),
      ).rejects.toEqual(notFoundError)

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should NOT retry on validation error (400)', async () => {
      const validationError = {
        response: { status: 400 },
        message: 'Bad request',
      }
      const operation = vi.fn().mockRejectedValue(validationError)

      await expect(
        withRetry(operation, { initialDelayMs: 10 }),
      ).rejects.toEqual(validationError)

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on network errors', async () => {
      const networkErrors = [
        new Error('ECONNRESET: Connection reset'),
        new Error('ETIMEDOUT: Request timeout'),
        new Error('ECONNREFUSED: Connection refused'),
        new Error('ENOTFOUND: DNS lookup failed'),
      ]

      for (const error of networkErrors) {
        const operation = vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce('success')

        const result = await withRetry(operation, { initialDelayMs: 10 })

        expect(result).toBe('success')
        expect(operation).toHaveBeenCalledTimes(2)
      }
    })

    it('should use exponential backoff for delays', async () => {
      const retryableError = {
        response: { status: 500 },
        message: 'Server error',
      }
      const operation = vi
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success')

      const startTime = Date.now()
      await withRetry(operation, {
        maxRetries: 2,
        initialDelayMs: 100,
        maxDelayMs: 10000,
      })
      const elapsedTime = Date.now() - startTime

      // First delay: 100ms, Second delay: 200ms = ~300ms total
      // Allow some tolerance for timing
      expect(elapsedTime).toBeGreaterThanOrEqual(250)
      expect(elapsedTime).toBeLessThan(500)
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should cap delay at maxDelayMs', async () => {
      const retryableError = {
        response: { status: 429 },
        message: 'Rate limit',
      }
      const operation = vi.fn().mockRejectedValue(retryableError)

      const startTime = Date.now()
      await expect(
        withRetry(operation, {
          maxRetries: 3,
          initialDelayMs: 5000,
          maxDelayMs: 100, // Cap at 100ms
        }),
      ).rejects.toEqual(retryableError)
      const elapsedTime = Date.now() - startTime

      // With cap at 100ms: 100 + 100 + 100 = ~300ms
      // Without cap: 5000 + 10000 + 20000 = 35 seconds
      expect(elapsedTime).toBeLessThan(1000)
      expect(operation).toHaveBeenCalledTimes(4) // Initial + 3 retries
    })

    it('should respect custom retry options', async () => {
      const retryableError = {
        response: { status: 503 },
        message: 'Service unavailable',
      }
      const operation = vi.fn().mockRejectedValue(retryableError)

      await expect(
        withRetry(operation, {
          maxRetries: 1,
          initialDelayMs: 10,
        }),
      ).rejects.toEqual(retryableError)

      // Initial + 1 retry = 2 calls
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should use environment variables for defaults', () => {
      expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(2)
      expect(DEFAULT_RETRY_OPTIONS.initialDelayMs).toBe(2000)
      expect(DEFAULT_RETRY_OPTIONS.maxDelayMs).toBe(10000)
      expect(DEFAULT_RETRY_OPTIONS.retryableStatuses).toEqual([
        429, 500, 502, 503, 504,
      ])
    })

    it('should handle errors without response property', async () => {
      const plainError = new Error('Plain error')
      const operation = vi.fn().mockRejectedValue(plainError)

      await expect(
        withRetry(operation, { initialDelayMs: 10 }),
      ).rejects.toThrow('Plain error')

      // Should not retry on plain error
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should handle null/undefined errors gracefully', async () => {
      const operation = vi.fn().mockRejectedValue(null)

      await expect(
        withRetry(operation, { initialDelayMs: 10 }),
      ).rejects.toBeNull()

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry exact number of times specified', async () => {
      const operation = vi
        .fn()
        .mockRejectedValue({ response: { status: 500 }, message: 'Error' })

      await expect(
        withRetry(operation, { maxRetries: 5, initialDelayMs: 1 }),
      ).rejects.toBeDefined()

      // Initial + 5 retries = 6 total calls
      expect(operation).toHaveBeenCalledTimes(6)
    })

    it('should preserve error details when all retries fail', async () => {
      const specificError = {
        response: { status: 500, data: { error: 'Specific error details' } },
        message: 'Server error with details',
      }
      const operation = vi.fn().mockRejectedValue(specificError)

      await expect(
        withRetry(operation, { maxRetries: 1, initialDelayMs: 10 }),
      ).rejects.toEqual(specificError)
    })

    it('should handle async operation that throws synchronously', async () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Sync error')
      })

      await expect(
        withRetry(operation, { initialDelayMs: 10 }),
      ).rejects.toThrow('Sync error')

      expect(operation).toHaveBeenCalledTimes(1)
    })
  })
})
