import { log } from './helper'

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /**Maximum number of retry attempts */
  maxRetries: number
  /** Initial delay in milliseconds before first retry */
  initialDelayMs: number
  /** Maximum delay in milliseconds (caps exponential backoff) */
  maxDelayMs: number
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[]
  /** Error types that should trigger a retry */
  retryableErrors: Array<new (...args: unknown[]) => Error>
}

/**
 * Default retry configuration (conservative approach)
 * - 2 retries max
 * - 2 second initial delay
 * - Exponential backoff capped at 10 seconds
 * - Retries on rate limits (429) and server errors (5xx)
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: parseInt(process.env.DATADOG_MAX_RETRIES || '2', 10),
  initialDelayMs: parseInt(process.env.DATADOG_RETRY_DELAY_MS || '2000', 10),
  maxDelayMs: 10000,
  retryableStatuses: [429, 500, 502, 503, 504],
  retryableErrors: [],
}

/**
 * Execute an async operation with automatic retry logic.
 *
 * Retries on transient failures (rate limits, server errors, network issues)
 * with exponential backoff. Non-retryable errors fail immediately.
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration (merged with defaults)
 * @returns Result of the operation
 * @throws Last error if all retries fail
 *
 * @example
 * const data = await withRetry(() =>
 *   apiInstance.listLogs({ body: { filter, page: { limit } } })
 * )
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Check if error is retryable
      const isRetryable = isRetryableError(error, opts)

      // Don't retry on last attempt or non-retryable errors
      if (attempt === opts.maxRetries || !isRetryable) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(2, attempt),
        opts.maxDelayMs,
      )

      log(
        'info',
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms delay.`,
        `Error: ${lastError.message}`,
      )

      // Wait before retrying
      await sleep(delay)
    }
  }

  // This should never be reached due to throw in loop, but TypeScript needs it
  throw lastError!
}

/**
 * Check if an error should trigger a retry attempt.
 *
 * Retries on:
 * - HTTP 429 (rate limit)
 * - HTTP 5xx (server errors)
 * - Network errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED)
 *
 * Does NOT retry on:
 * - HTTP 4xx (except 429) - client errors like 403, 404
 * - Validation errors
 * - Unknown errors
 *
 * @param error - Error to check
 * @param options - Retry configuration
 * @returns True if error is retryable
 */
function isRetryableError(error: unknown, options: RetryOptions): boolean {
  // Check if it's a Datadog API error with retryable status
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    if (
      response?.status &&
      options.retryableStatuses.includes(response.status)
    ) {
      return true
    }
  }

  // Check if it's a network error
  if (error instanceof Error) {
    const networkErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
    ]
    if (networkErrors.some((code) => error.message.includes(code))) {
      return true
    }
  }

  // Check against configured error types
  if (error instanceof Error && options.retryableErrors.length > 0) {
    return options.retryableErrors.some(
      (ErrorType) => error instanceof ErrorType,
    )
  }

  return false
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
