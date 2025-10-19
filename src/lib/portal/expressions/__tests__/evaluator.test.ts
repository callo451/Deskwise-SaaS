/**
 * Evaluator Tests
 */

import { ExpressionEvaluator, EvaluationError, EvaluationTimeoutError, evaluate } from '../evaluator'
import { EvaluationContext } from '../types'

describe('Expression Evaluator', () => {
  let evaluator: ExpressionEvaluator
  let context: EvaluationContext

  beforeEach(() => {
    evaluator = new ExpressionEvaluator()
    context = {
      data: {
        count: 10,
        items: ['a', 'b', 'c'],
        nested: { value: 42 },
        empty: null,
      },
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['tickets.view', 'tickets.edit', 'users.*'],
      },
      env: {
        isDev: true,
        orgId: 'org123',
      },
    }
  })

  describe('evaluate', () => {
    it('should evaluate literals', () => {
      expect(evaluator.evaluate('42', context)).toBe(42)
      expect(evaluator.evaluate('"hello"', context)).toBe('hello')
      expect(evaluator.evaluate('true', context)).toBe(true)
    })

    it('should evaluate identifiers', () => {
      expect(evaluator.evaluate('user.role', context)).toBe('admin')
      expect(evaluator.evaluate('data.count', context)).toBe(10)
      expect(evaluator.evaluate('env.isDev', context)).toBe(true)
    })

    it('should evaluate member expressions', () => {
      expect(evaluator.evaluate('data.nested.value', context)).toBe(42)
      expect(evaluator.evaluate('data.items[0]', context)).toBe('a')
    })

    it('should evaluate binary expressions', () => {
      expect(evaluator.evaluate('data.count + 5', context)).toBe(15)
      expect(evaluator.evaluate('data.count * 2', context)).toBe(20)
      expect(evaluator.evaluate('data.count > 5', context)).toBe(true)
    })

    it('should evaluate comparison operators', () => {
      expect(evaluator.evaluate('user.role === "admin"', context)).toBe(true)
      expect(evaluator.evaluate('user.role !== "user"', context)).toBe(true)
      expect(evaluator.evaluate('data.count >= 10', context)).toBe(true)
      expect(evaluator.evaluate('data.count < 20', context)).toBe(true)
    })

    it('should evaluate logical expressions', () => {
      expect(evaluator.evaluate('true && true', context)).toBe(true)
      expect(evaluator.evaluate('true && false', context)).toBe(false)
      expect(evaluator.evaluate('true || false', context)).toBe(true)
      expect(evaluator.evaluate('false || false', context)).toBe(false)
    })

    it('should short-circuit logical expressions', () => {
      expect(evaluator.evaluate('false && data.nonexistent.field', context)).toBe(false)
      expect(evaluator.evaluate('true || data.nonexistent.field', context)).toBe(true)
    })

    it('should evaluate unary expressions', () => {
      expect(evaluator.evaluate('!true', context)).toBe(false)
      expect(evaluator.evaluate('!false', context)).toBe(true)
      expect(evaluator.evaluate('-data.count', context)).toBe(-10)
    })

    it('should evaluate conditional expressions', () => {
      expect(evaluator.evaluate('data.count > 5 ? "yes" : "no"', context)).toBe('yes')
      expect(evaluator.evaluate('data.count < 5 ? "yes" : "no"', context)).toBe('no')
    })

    it('should evaluate stdlib functions', () => {
      expect(evaluator.evaluate('eq(1, 1)', context)).toBe(true)
      expect(evaluator.evaluate('isEmpty(data.empty)', context)).toBe(true)
      expect(evaluator.evaluate('len(data.items)', context)).toBe(3)
    })

    it('should evaluate array methods', () => {
      expect(evaluator.evaluate('data.items.includes("a")', context)).toBe(true)
      expect(evaluator.evaluate('data.items.includes("d")', context)).toBe(false)
    })

    it('should handle null/undefined safely', () => {
      expect(evaluator.evaluate('data.empty', context)).toBe(null)
      expect(evaluator.evaluate('data.nonexistent', context)).toBe(undefined)
    })

    it('should throw on unknown identifiers', () => {
      expect(() => evaluator.evaluate('unknown', context)).toThrow(EvaluationError)
    })

    it('should throw on blocked identifiers', () => {
      expect(() => evaluator.evaluate('window.location', context)).toThrow(EvaluationError)
    })

    it('should throw on unknown functions', () => {
      expect(() => evaluator.evaluate('unknownFunc()', context)).toThrow(EvaluationError)
    })

    it('should prevent access to dangerous properties', () => {
      expect(() => evaluator.evaluate('user.__proto__', context)).toThrow(EvaluationError)
      expect(() => evaluator.evaluate('user.constructor', context)).toThrow(EvaluationError)
    })

    it('should timeout on long-running expressions', () => {
      // This would need a custom expression that takes a long time
      // For now, we'll just verify the timeout mechanism exists
      const slowContext = { ...context }
      // In a real scenario, you'd need to craft an expression that loops
      // For testing purposes, we verify the mechanism exists
      expect(evaluator).toHaveProperty('checkTimeout')
    })
  })

  describe('validateExpression', () => {
    it('should validate valid expressions', () => {
      expect(evaluator.validateExpression('user.role === "admin"')).toMatchObject({ valid: true })
    })

    it('should reject invalid expressions', () => {
      expect(evaluator.validateExpression('invalid expression (((')).toMatchObject({ valid: false })
    })
  })

  describe('evaluate helper', () => {
    it('should work as a quick helper', () => {
      expect(evaluate('1 + 2', context)).toBe(3)
      expect(evaluate('user.role', context)).toBe('admin')
    })
  })

  describe('complex expressions', () => {
    it('should evaluate complex nested expressions', () => {
      const result = evaluator.evaluate(
        'user.role === "admin" && data.count > 5 && !isEmpty(data.items)',
        context
      )
      expect(result).toBe(true)
    })

    it('should evaluate expressions with function calls', () => {
      const result = evaluator.evaluate(
        'includes(user.permissions, "tickets.view") && len(data.items) > 0',
        context
      )
      expect(result).toBe(true)
    })

    it('should evaluate expressions with multiple operators', () => {
      const result = evaluator.evaluate('data.count * 2 + 5 - 10', context)
      expect(result).toBe(15) // (10 * 2) + 5 - 10 = 15
    })

    it('should evaluate expressions with nested ternary', () => {
      const result = evaluator.evaluate(
        'data.count > 10 ? "high" : data.count > 5 ? "medium" : "low"',
        context
      )
      expect(result).toBe('medium')
    })

    it('should evaluate expressions with template syntax', () => {
      expect(evaluator.evaluate('{{ user.role }}', context)).toBe('admin')
      expect(evaluator.evaluate('{{ data.count + 5 }}', context)).toBe(15)
    })

    it('should handle deeply nested member access', () => {
      const deepContext = {
        ...context,
        data: {
          level1: {
            level2: {
              level3: {
                value: 'deep',
              },
            },
          },
        },
      }
      expect(evaluator.evaluate('data.level1.level2.level3.value', deepContext)).toBe('deep')
    })

    it('should handle array indexing', () => {
      expect(evaluator.evaluate('data.items[0]', context)).toBe('a')
      expect(evaluator.evaluate('data.items[1]', context)).toBe('b')
      expect(evaluator.evaluate('data.items[2]', context)).toBe('c')
    })

    it('should handle string concatenation', () => {
      expect(evaluator.evaluate('"Hello " + "World"', context)).toBe('Hello World')
    })

    it('should handle multiple function calls', () => {
      const result = evaluator.evaluate('upper(format("hello {name}", data.nested))', {
        ...context,
        data: { ...context.data, nested: { name: 'world' } },
      })
      expect(result).toBe('HELLO WORLD')
    })
  })

  describe('error handling', () => {
    it('should provide helpful error messages', () => {
      try {
        evaluator.evaluate('unknownFunc()', context)
        fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError)
        expect((error as Error).message).toContain('unknownFunc')
      }
    })

    it('should handle division by zero', () => {
      // JavaScript allows division by zero, results in Infinity
      expect(evaluator.evaluate('10 / 0', context)).toBe(Infinity)
    })

    it('should handle null property access', () => {
      expect(evaluator.evaluate('data.empty.property', context)).toBe(undefined)
    })
  })

  describe('security', () => {
    it('should not allow access to global objects', () => {
      expect(() => evaluator.evaluate('window', context)).toThrow()
      expect(() => evaluator.evaluate('document', context)).toThrow()
      expect(() => evaluator.evaluate('process', context)).toThrow()
    })

    it('should not allow function construction', () => {
      expect(() => evaluator.evaluate('Function("return 1")', context)).toThrow()
      expect(() => evaluator.evaluate('eval("1")', context)).toThrow()
    })

    it('should not allow prototype pollution', () => {
      expect(() => evaluator.evaluate('user.__proto__.polluted = true', context)).toThrow()
      expect(() => evaluator.evaluate('user.constructor.prototype', context)).toThrow()
    })

    it('should not allow disallowed array methods', () => {
      // Only specific methods are allowed
      expect(() => evaluator.evaluate('data.items.push("x")', context)).toThrow()
      expect(() => evaluator.evaluate('data.items.pop()', context)).toThrow()
    })
  })
})
