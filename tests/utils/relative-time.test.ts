import { describe, it, expect } from 'vitest'
import {
  parseRelativeTime,
  isRelativeTime,
  parseTimeParam,
} from '../../src/utils/relative-time'

describe('Relative Time Parser', () => {
  describe('parseRelativeTime', () => {
    it('should parse "now" as current timestamp', () => {
      const result = parseRelativeTime('now')
      const now = Math.floor(Date.now() / 1000)
      expect(result).toBeCloseTo(now, -1) // Within 10 seconds
    })

    it('should parse "now-1h" as 1 hour ago', () => {
      const result = parseRelativeTime('now-1h')
      const expected = Math.floor(Date.now() / 1000) - 3600
      expect(result).toBeCloseTo(expected, -1)
    })

    it('should parse "now-7d" as 7 days ago', () => {
      const result = parseRelativeTime('now-7d')
      const expected = Math.floor(Date.now() / 1000) - 7 * 86400
      expect(result).toBeCloseTo(expected, -1)
    })

    it('should parse "now-1w" as 1 week ago', () => {
      const result = parseRelativeTime('now-1w')
      const expected = Math.floor(Date.now() / 1000) - 604800
      expect(result).toBeCloseTo(expected, -1)
    })

    it('should parse "now-1mo" as 30 days ago', () => {
      const result = parseRelativeTime('now-1mo')
      const expected = Math.floor(Date.now() / 1000) - 2592000
      expect(result).toBeCloseTo(expected, -1)
    })

    it('should throw on invalid format', () => {
      expect(() => parseRelativeTime('invalid')).toThrow(
        'Invalid relative time format',
      )
      expect(() => parseRelativeTime('now-7x')).toThrow(
        'Invalid relative time format',
      )
    })
  })

  describe('isRelativeTime', () => {
    it('should identify relative time strings', () => {
      expect(isRelativeTime('now')).toBe(true)
      expect(isRelativeTime('now-7d')).toBe(true)
      expect(isRelativeTime('now-1h')).toBe(true)
    })

    it('should reject non-relative time strings', () => {
      expect(isRelativeTime('2024-01-01')).toBe(false)
      expect(isRelativeTime(1234567890)).toBe(false)
      expect(isRelativeTime('invalid')).toBe(false)
    })
  })

  describe('parseTimeParam', () => {
    it('should pass through numbers', () => {
      expect(parseTimeParam(1234567890)).toBe(1234567890)
    })

    it('should parse relative strings', () => {
      const result = parseTimeParam('now-1h')
      const expected = Math.floor(Date.now() / 1000) - 3600
      expect(result).toBeCloseTo(expected!, -1)
    })

    it('should return undefined for undefined', () => {
      expect(parseTimeParam(undefined)).toBeUndefined()
    })
  })
})
