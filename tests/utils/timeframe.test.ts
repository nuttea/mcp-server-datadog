import { describe, it, expect } from 'vitest'
import { parseTimeframe, TIMEFRAME_PRESETS } from '../../src/utils/timeframe'

describe('parseTimeframe', () => {
  // Mock current time for consistent testing
  const mockNow = 1640000000 // 2021-12-20 12:26:40

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(mockNow * 1000))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Valid timeframes', () => {
    it('should parse hours correctly', () => {
      const result = parseTimeframe('1h')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 3600) // 1 hour
    })

    it('should parse 6 hours', () => {
      const result = parseTimeframe('6h')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 21600) // 6 hours
    })

    it('should parse 24 hours', () => {
      const result = parseTimeframe('24h')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 86400) // 24 hours
    })

    it('should parse days correctly', () => {
      const result = parseTimeframe('7d')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 604800) // 7 days
    })

    it('should parse weeks correctly', () => {
      const result = parseTimeframe('1w')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 604800) // 1 week = 7 days
    })

    it('should parse months correctly', () => {
      const result = parseTimeframe('1mo')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 2592000) // 30 days
    })

    it('should parse 30 days', () => {
      const result = parseTimeframe('30d')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 2592000) // 30 days
    })

    it('should parse 90 days (maximum)', () => {
      const result = parseTimeframe('90d')
      expect(result.to).toBe(mockNow)
      expect(result.from).toBe(mockNow - 7776000) // 90 days
    })
  })

  describe('Invalid timeframes', () => {
    it('should reject invalid format', () => {
      expect(() => parseTimeframe('invalid')).toThrow(
        'Invalid timeframe format',
      )
    })

    it('should reject missing unit', () => {
      expect(() => parseTimeframe('7')).toThrow('Invalid timeframe format')
    })

    it('should reject unknown unit', () => {
      expect(() => parseTimeframe('1y')).toThrow('Invalid timeframe format')
    })

    it('should reject timeframe > 90 days', () => {
      expect(() => parseTimeframe('100d')).toThrow('Timeframe too large')
    })

    it('should reject large months', () => {
      expect(() => parseTimeframe('4mo')).toThrow('Timeframe too large')
    })
  })

  describe('Timeframe presets', () => {
    it('should have valid preset values', () => {
      expect(TIMEFRAME_PRESETS.LAST_HOUR).toBe('1h')
      expect(TIMEFRAME_PRESETS.LAST_WEEK).toBe('7d')
      expect(TIMEFRAME_PRESETS.LAST_WEEK_SHORT).toBe('1w')
      expect(TIMEFRAME_PRESETS.LAST_MONTH).toBe('30d')
    })

    it('should parse all presets successfully', () => {
      Object.values(TIMEFRAME_PRESETS).forEach((preset) => {
        expect(() => parseTimeframe(preset)).not.toThrow()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle 1-hour minimum', () => {
      const result = parseTimeframe('1h')
      expect(result.to - result.from).toBe(3600)
    })

    it('should handle 90-day maximum', () => {
      const result = parseTimeframe('90d')
      expect(result.to - result.from).toBe(7776000)
    })

    it('should return integer timestamps', () => {
      const result = parseTimeframe('1h')
      expect(Number.isInteger(result.from)).toBe(true)
      expect(Number.isInteger(result.to)).toBe(true)
    })
  })
})
