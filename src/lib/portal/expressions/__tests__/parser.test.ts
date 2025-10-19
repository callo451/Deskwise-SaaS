/**
 * Parser Tests
 */

import { parseExpression, validateExpression, extractIdentifiers } from '../parser'

describe('Expression Parser', () => {
  describe('parseExpression', () => {
    it('should parse literals', () => {
      expect(parseExpression('42')).toMatchObject({ type: 'Literal', value: 42 })
      expect(parseExpression('"hello"')).toMatchObject({ type: 'Literal', value: 'hello' })
      expect(parseExpression('true')).toMatchObject({ type: 'Literal', value: true })
    })

    it('should parse identifiers', () => {
      expect(parseExpression('user')).toMatchObject({ type: 'Identifier', name: 'user' })
      expect(parseExpression('data')).toMatchObject({ type: 'Identifier', name: 'data' })
    })

    it('should parse member expressions', () => {
      const result = parseExpression('user.role')
      expect(result.type).toBe('MemberExpression')
    })

    it('should parse binary expressions', () => {
      const result = parseExpression('1 + 2')
      expect(result.type).toBe('BinaryExpression')
      expect(result.operator).toBe('+')
    })

    it('should parse logical expressions', () => {
      const result = parseExpression('true && false')
      expect(result.type).toBe('LogicalExpression')
      expect(result.operator).toBe('&&')
    })

    it('should remove template literal syntax', () => {
      expect(() => parseExpression('{{ user.role }}')).not.toThrow()
    })

    it('should throw on empty expression', () => {
      expect(() => parseExpression('')).toThrow('Empty expression')
    })
  })

  describe('validateExpression', () => {
    it('should accept valid expressions', () => {
      expect(validateExpression('user.role === "admin"')).toMatchObject({ valid: true })
      expect(validateExpression('data.count > 0')).toMatchObject({ valid: true })
      expect(validateExpression('user.permissions.includes("view")')).toMatchObject({ valid: true })
    })

    it('should reject blocked identifiers', () => {
      expect(validateExpression('window.location')).toMatchObject({
        valid: false,
        error: expect.stringContaining('window'),
      })
      expect(validateExpression('document.cookie')).toMatchObject({
        valid: false,
        error: expect.stringContaining('document'),
      })
      expect(validateExpression('eval("code")')).toMatchObject({
        valid: false,
        error: expect.stringContaining('eval'),
      })
      expect(validateExpression('Function("return 1")')).toMatchObject({
        valid: false,
        error: expect.stringContaining('Function'),
      })
    })

    it('should reject unknown root identifiers', () => {
      expect(validateExpression('unknown.field')).toMatchObject({
        valid: false,
        error: expect.stringContaining('unknown'),
      })
    })

    it('should reject disallowed operators', () => {
      expect(validateExpression('1 << 2')).toMatchObject({
        valid: false,
        error: expect.stringContaining('<<'),
      })
      expect(validateExpression('a & b')).toMatchObject({
        valid: false,
        error: expect.stringContaining('&'),
      })
    })

    it('should reject unknown functions', () => {
      expect(validateExpression('unknownFunc()')).toMatchObject({
        valid: false,
        error: expect.stringContaining('unknownFunc'),
      })
    })

    it('should accept allowed functions', () => {
      expect(validateExpression('eq(1, 2)')).toMatchObject({ valid: true })
      expect(validateExpression('isEmpty(data.value)')).toMatchObject({ valid: true })
      expect(validateExpression('format("Hello {name}", data)')).toMatchObject({ valid: true })
    })

    it('should reject expressions that are too deep', () => {
      // Create a very deep expression
      let expr = 'data.a'
      for (let i = 0; i < 15; i++) {
        expr += `.b${i}`
      }
      const result = validateExpression(expr)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('depth')
    })

    it('should accept ternary expressions', () => {
      expect(validateExpression('user.role === "admin" ? "yes" : "no"')).toMatchObject({
        valid: true,
      })
    })

    it('should accept array methods', () => {
      expect(validateExpression('data.items.includes(5)')).toMatchObject({ valid: true })
    })
  })

  describe('extractIdentifiers', () => {
    it('should extract root identifiers', () => {
      expect(extractIdentifiers('user.role')).toContain('user.role')
      expect(extractIdentifiers('data.count')).toContain('data.count')
    })

    it('should extract multiple identifiers', () => {
      const identifiers = extractIdentifiers('user.role === "admin" && data.count > 0')
      expect(identifiers).toContain('user.role')
      expect(identifiers).toContain('data.count')
    })

    it('should handle nested member expressions', () => {
      const identifiers = extractIdentifiers('user.profile.name')
      expect(identifiers).toContain('user.profile.name')
    })

    it('should handle function calls', () => {
      const identifiers = extractIdentifiers('isEmpty(data.value)')
      expect(identifiers).toContain('data.value')
    })

    it('should return empty array for invalid expressions', () => {
      expect(extractIdentifiers('invalid expression (((')).toEqual([])
    })
  })
})
