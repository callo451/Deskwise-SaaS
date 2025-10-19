/**
 * Standard Library Tests
 */

import { stdlib } from '../stdlib'

describe('Standard Library', () => {
  describe('eq', () => {
    it('should check equality', () => {
      expect(stdlib.eq(1, 1)).toBe(true)
      expect(stdlib.eq(1, 2)).toBe(false)
      expect(stdlib.eq('a', 'a')).toBe(true)
      expect(stdlib.eq('a', 'b')).toBe(false)
      expect(stdlib.eq(null, null)).toBe(true)
      expect(stdlib.eq(undefined, undefined)).toBe(true)
      expect(stdlib.eq(null, undefined)).toBe(false)
    })
  })

  describe('and', () => {
    it('should perform logical AND', () => {
      expect(stdlib.and(true, true)).toBe(true)
      expect(stdlib.and(true, false)).toBe(false)
      expect(stdlib.and(false, false)).toBe(false)
      expect(stdlib.and(1, 2, 3)).toBe(true)
      expect(stdlib.and(1, 0, 3)).toBe(false)
    })
  })

  describe('or', () => {
    it('should perform logical OR', () => {
      expect(stdlib.or(true, false)).toBe(true)
      expect(stdlib.or(false, false)).toBe(false)
      expect(stdlib.or(false, true)).toBe(true)
      expect(stdlib.or(0, 0, 1)).toBe(true)
      expect(stdlib.or(0, 0, 0)).toBe(false)
    })
  })

  describe('not', () => {
    it('should perform logical NOT', () => {
      expect(stdlib.not(true)).toBe(false)
      expect(stdlib.not(false)).toBe(true)
      expect(stdlib.not(1)).toBe(false)
      expect(stdlib.not(0)).toBe(true)
      expect(stdlib.not(null)).toBe(true)
    })
  })

  describe('len', () => {
    it('should return length of arrays', () => {
      expect(stdlib.len([1, 2, 3])).toBe(3)
      expect(stdlib.len([])).toBe(0)
    })

    it('should return length of strings', () => {
      expect(stdlib.len('hello')).toBe(5)
      expect(stdlib.len('')).toBe(0)
    })

    it('should return 0 for null/undefined', () => {
      expect(stdlib.len(null)).toBe(0)
      expect(stdlib.len(undefined)).toBe(0)
    })
  })

  describe('includes', () => {
    it('should check if array includes value', () => {
      expect(stdlib.includes([1, 2, 3], 2)).toBe(true)
      expect(stdlib.includes([1, 2, 3], 4)).toBe(false)
      expect(stdlib.includes(['a', 'b'], 'a')).toBe(true)
    })

    it('should return false for non-arrays', () => {
      expect(stdlib.includes('hello', 'e')).toBe(false)
      expect(stdlib.includes(null, 1)).toBe(false)
    })
  })

  describe('isEmpty', () => {
    it('should check if value is empty', () => {
      expect(stdlib.isEmpty(null)).toBe(true)
      expect(stdlib.isEmpty(undefined)).toBe(true)
      expect(stdlib.isEmpty('')).toBe(true)
      expect(stdlib.isEmpty([])).toBe(true)
      expect(stdlib.isEmpty({})).toBe(true)
      expect(stdlib.isEmpty(0)).toBe(true)
      expect(stdlib.isEmpty('hello')).toBe(false)
      expect(stdlib.isEmpty([1])).toBe(false)
      expect(stdlib.isEmpty({ a: 1 })).toBe(false)
      expect(stdlib.isEmpty(1)).toBe(false)
    })
  })

  describe('format', () => {
    it('should format string templates', () => {
      expect(stdlib.format('Hello {name}', { name: 'World' })).toBe('Hello World')
      expect(stdlib.format('{a} + {b} = {c}', { a: 1, b: 2, c: 3 })).toBe('1 + 2 = 3')
    })

    it('should leave unknown placeholders', () => {
      expect(stdlib.format('Hello {name}', {})).toBe('Hello {name}')
    })

    it('should handle non-string templates', () => {
      expect(stdlib.format(123 as any, {})).toBe('123')
    })
  })

  describe('date', () => {
    it('should format dates', () => {
      const d = new Date('2025-10-13')
      const result = stdlib.date(d)
      expect(result).toMatch(/10\/13\/2025/)
    })

    it('should handle date strings', () => {
      const result = stdlib.date('2025-10-13')
      expect(result).toMatch(/10\/13\/2025/)
    })

    it('should handle null/undefined', () => {
      expect(stdlib.date(null)).toBe('')
      expect(stdlib.date(undefined)).toBe('')
    })

    it('should handle invalid dates', () => {
      expect(stdlib.date('invalid')).toBe('invalid')
    })
  })

  describe('datetime', () => {
    it('should format date and time', () => {
      const d = new Date('2025-10-13T15:45:00')
      const result = stdlib.datetime(d)
      expect(result).toContain('10/13/2025')
      expect(result).toContain('PM')
    })
  })

  describe('first', () => {
    it('should get first n items', () => {
      expect(stdlib.first([1, 2, 3, 4, 5])).toEqual([1])
      expect(stdlib.first([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3])
    })

    it('should handle non-arrays', () => {
      expect(stdlib.first('hello' as any)).toEqual([])
    })
  })

  describe('last', () => {
    it('should get last n items', () => {
      expect(stdlib.last([1, 2, 3, 4, 5])).toEqual([5])
      expect(stdlib.last([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5])
    })
  })

  describe('join', () => {
    it('should join array with separator', () => {
      expect(stdlib.join([1, 2, 3], ', ')).toBe('1, 2, 3')
      expect(stdlib.join(['a', 'b', 'c'])).toBe('a,b,c')
    })

    it('should handle non-arrays', () => {
      expect(stdlib.join('hello' as any, '-')).toBe('')
    })
  })

  describe('upper', () => {
    it('should convert to uppercase', () => {
      expect(stdlib.upper('hello')).toBe('HELLO')
      expect(stdlib.upper('Hello World')).toBe('HELLO WORLD')
    })
  })

  describe('lower', () => {
    it('should convert to lowercase', () => {
      expect(stdlib.lower('HELLO')).toBe('hello')
      expect(stdlib.lower('Hello World')).toBe('hello world')
    })
  })

  describe('trim', () => {
    it('should trim whitespace', () => {
      expect(stdlib.trim('  hello  ')).toBe('hello')
      expect(stdlib.trim('\n\thello\n\t')).toBe('hello')
    })
  })

  describe('default', () => {
    it('should return default for null/undefined', () => {
      expect(stdlib.default(null, 'fallback')).toBe('fallback')
      expect(stdlib.default(undefined, 'fallback')).toBe('fallback')
    })

    it('should return value if not null/undefined', () => {
      expect(stdlib.default('value', 'fallback')).toBe('value')
      expect(stdlib.default(0, 'fallback')).toBe(0)
      expect(stdlib.default('', 'fallback')).toBe('')
    })
  })
})
