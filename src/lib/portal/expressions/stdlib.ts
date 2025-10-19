/**
 * Standard Library for Safe Expressions
 *
 * Whitelisted functions that can be used in expressions.
 * NO OTHER FUNCTIONS ARE ALLOWED.
 */

import { StandardLibrary } from './types'

export const stdlib: StandardLibrary = {
  /**
   * Equality check (handles null/undefined safely)
   */
  eq(a: any, b: any): boolean {
    return a === b
  },

  /**
   * Logical AND - all arguments must be truthy
   */
  and(...args: any[]): boolean {
    return args.every(arg => !!arg)
  },

  /**
   * Logical OR - at least one argument must be truthy
   */
  or(...args: any[]): boolean {
    return args.some(arg => !!arg)
  },

  /**
   * Logical NOT
   */
  not(val: any): boolean {
    return !val
  },

  /**
   * Get length of array or string
   */
  len(val: any): number {
    if (val == null) return 0
    if (Array.isArray(val) || typeof val === 'string') {
      return val.length
    }
    return 0
  },

  /**
   * Check if array includes a value
   */
  includes(arr: any, val: any): boolean {
    if (!Array.isArray(arr)) return false
    return arr.includes(val)
  },

  /**
   * Check if value is empty (null, undefined, empty string, empty array, or 0)
   */
  isEmpty(val: any): boolean {
    if (val == null) return true
    if (typeof val === 'string' || Array.isArray(val)) {
      return val.length === 0
    }
    if (typeof val === 'number') return val === 0
    if (typeof val === 'object') return Object.keys(val).length === 0
    return false
  },

  /**
   * Simple string template formatting
   * Example: format("Hello {name}", {name: "World"}) => "Hello World"
   */
  format(template: string, data: Record<string, any>): string {
    if (typeof template !== 'string') return String(template)
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] != null ? String(data[key]) : match
    })
  },

  /**
   * Format date to locale string
   * Example: date(new Date()) => "10/13/2025"
   */
  date(val: any): string {
    if (val == null) return ''
    try {
      const d = val instanceof Date ? val : new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleDateString()
    } catch {
      return String(val)
    }
  },

  /**
   * Format date and time to locale string
   * Example: datetime(new Date()) => "10/13/2025, 3:45:00 PM"
   */
  datetime(val: any): string {
    if (val == null) return ''
    try {
      const d = val instanceof Date ? val : new Date(val)
      if (isNaN(d.getTime())) return String(val)
      return d.toLocaleString()
    } catch {
      return String(val)
    }
  },

  /**
   * Get first n items from array
   */
  first(arr: any[], n: number = 1): any[] {
    if (!Array.isArray(arr)) return []
    return arr.slice(0, n)
  },

  /**
   * Get last n items from array
   */
  last(arr: any[], n: number = 1): any[] {
    if (!Array.isArray(arr)) return []
    return arr.slice(-n)
  },

  /**
   * Join array with separator
   */
  join(arr: any[], separator: string = ','): string {
    if (!Array.isArray(arr)) return ''
    return arr.join(separator)
  },

  /**
   * Convert to uppercase
   */
  upper(val: any): string {
    return String(val).toUpperCase()
  },

  /**
   * Convert to lowercase
   */
  lower(val: any): string {
    return String(val).toLowerCase()
  },

  /**
   * Trim whitespace
   */
  trim(val: any): string {
    return String(val).trim()
  },

  /**
   * Get default value if null/undefined
   */
  default(val: any, defaultVal: any): any {
    return val != null ? val : defaultVal
  },
}

/**
 * Check if a function name is allowed
 */
export function isAllowedFunction(name: string): boolean {
  return name in stdlib
}

/**
 * Get list of all allowed function names
 */
export function getAllowedFunctions(): string[] {
  return Object.keys(stdlib)
}
