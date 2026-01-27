import { ZodSchema, ZodError } from 'zod'
import { log } from './helper'

/**
 * Parse data with a Zod schema, logging validation warnings but not throwing errors.
 *
 * This lenient validation approach ensures backward compatibility while providing
 * visibility into validation violations through stderr logging.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Context string for logging (e.g., tool name)
 * @returns Parsed data (or original data cast to type if validation fails)
 *
 * @example
 * const params = parseWithWarnings(
 *   GetLogsSchema,
 *   request.params.arguments,
 *   'get_logs'
 * )
 */
export function parseWithWarnings<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context: string,
): T {
  // Apply defaults for common timestamp patterns (last hour if not provided)
  // Check if this tool likely needs time ranges
  const needsTimeRange =
    context.includes('log') ||
    context.includes('rum') ||
    context.includes('trace') ||
    context.includes('metric') ||
    context.includes('service')

  if (
    data &&
    typeof data === 'object' &&
    !('from' in data) &&
    !('to' in data) &&
    needsTimeRange
  ) {
    const now = Math.floor(Date.now() / 1000)
    // Use longer timeframe for service discovery (7 days vs 1 hour)
    const defaultTimeRange = context.includes('get_all_services')
      ? 604800 // 7 days for service discovery
      : 3600 // 1 hour for other tools

    data = {
      ...data,
      from: now - defaultTimeRange,
      to: now,
      query: (data as Record<string, unknown>).query || '*',
    }
    const timeDesc = context.includes('get_all_services')
      ? 'last 7 days'
      : 'last 1 hour'
    log('info', `[${context}] Auto-filled time range: ${timeDesc}`)
  }

  try {
    // Try to parse with schema - if successful, return validated data
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      // Log detailed validation warnings to stderr
      log(
        'error',
        `Validation warning in ${context}:`,
        JSON.stringify(error.format(), null, 2),
      )

      // Log individual field violations for clarity
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'root'
          log('error', `  - ${path}: ${err.message}`)
        })
      }

      // Log suggestion for future strict enforcement
      log(
        'info',
        `[${context}] Continuing with potentially invalid data. This may fail in future versions with strict validation.`,
      )
    }

    // Return data as-is (cast to expected type)
    // This allows the operation to proceed despite validation failures
    return data as T
  }
}
