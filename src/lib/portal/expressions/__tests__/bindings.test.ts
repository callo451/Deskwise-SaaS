/**
 * Bindings Tests
 */

import {
  BindingResolver,
  BindingError,
  resolveBindings,
  extractDataSources,
  validateBindings,
  createBinding,
  mergeBindings,
} from '../bindings'
import { DataBinding, EvaluationContext } from '../types'

describe('Binding System', () => {
  let resolver: BindingResolver
  let dataContext: Record<string, any>
  let user: EvaluationContext['user']
  let env: EvaluationContext['env']

  beforeEach(() => {
    resolver = new BindingResolver()
    dataContext = {
      tickets: {
        openCount: 5,
        closedCount: 10,
        items: [
          { id: 1, title: 'Ticket 1' },
          { id: 2, title: 'Ticket 2' },
        ],
      },
      users: {
        total: 20,
        active: 15,
      },
    }
    user = {
      id: 'user123',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['tickets.view'],
    }
    env = {
      isDev: true,
      orgId: 'org123',
    }
  })

  describe('BindingResolver', () => {
    describe('resolveBindings', () => {
      it('should resolve simple bindings', () => {
        const bindings: DataBinding[] = [
          { source: 'tickets', field: 'openCount', targetProp: 'count' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.count).toBe(5)
      })

      it('should resolve multiple bindings', () => {
        const bindings: DataBinding[] = [
          { source: 'tickets', field: 'openCount', targetProp: 'openTickets' },
          { source: 'tickets', field: 'closedCount', targetProp: 'closedTickets' },
          { source: 'users', field: 'total', targetProp: 'totalUsers' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result).toEqual({
          openTickets: 5,
          closedTickets: 10,
          totalUsers: 20,
        })
      })

      it('should resolve nested field paths', () => {
        const bindings: DataBinding[] = [
          { source: 'tickets', field: 'items[0].title', targetProp: 'firstTicket' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.firstTicket).toBe('Ticket 1')
      })

      it('should apply transforms', () => {
        const bindings: DataBinding[] = [
          {
            source: 'tickets',
            field: 'openCount',
            targetProp: 'label',
            transform: 'format("{value} open tickets", data)',
          },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.label).toBe('5 open tickets')
      })

      it('should handle context source', () => {
        const bindings: DataBinding[] = [
          { source: 'context', field: 'tickets.openCount', targetProp: 'count' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.count).toBe(5)
      })

      it('should handle missing source gracefully', () => {
        const bindings: DataBinding[] = [
          { source: 'nonexistent', field: 'value', targetProp: 'result' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.result).toBe(undefined)
      })

      it('should handle missing field gracefully', () => {
        const bindings: DataBinding[] = [
          { source: 'tickets', field: 'nonexistent', targetProp: 'result' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.result).toBe(undefined)
      })

      it('should continue on individual binding errors', () => {
        const bindings: DataBinding[] = [
          { source: 'tickets', field: 'openCount', targetProp: 'count' },
          { source: 'nonexistent', field: 'value', targetProp: 'error' },
          { source: 'users', field: 'total', targetProp: 'users' },
        ]

        const result = resolver.resolveBindings(bindings, dataContext, user, env)
        expect(result.count).toBe(5)
        expect(result.error).toBe(undefined)
        expect(result.users).toBe(20)
      })
    })

    describe('resolveBinding', () => {
      it('should resolve single binding', () => {
        const binding: DataBinding = {
          source: 'tickets',
          field: 'openCount',
          targetProp: 'count',
        }

        const result = resolver.resolveBinding(binding, dataContext, user, env)
        expect(result).toBe(5)
      })

      it('should apply transform with access to user context', () => {
        const binding: DataBinding = {
          source: 'tickets',
          field: 'openCount',
          targetProp: 'label',
          transform: 'user.role === "admin" ? data.value * 2 : data.value',
        }

        const result = resolver.resolveBinding(binding, dataContext, user, env)
        expect(result).toBe(10) // 5 * 2 for admin
      })

      it('should handle complex transforms', () => {
        const binding: DataBinding = {
          source: 'tickets',
          field: 'openCount',
          targetProp: 'status',
          transform: 'data.value > 10 ? "high" : data.value > 5 ? "medium" : "low"',
        }

        const result = resolver.resolveBinding(binding, dataContext, user, env)
        expect(result).toBe('low')
      })
    })
  })

  describe('resolveBindings helper', () => {
    it('should work as a quick helper', () => {
      const bindings: DataBinding[] = [
        { source: 'tickets', field: 'openCount', targetProp: 'count' },
      ]

      const result = resolveBindings(bindings, dataContext, user, env)
      expect(result.count).toBe(5)
    })
  })

  describe('extractDataSources', () => {
    it('should extract unique data source IDs', () => {
      const bindings: DataBinding[] = [
        { source: 'tickets', field: 'openCount', targetProp: 'open' },
        { source: 'tickets', field: 'closedCount', targetProp: 'closed' },
        { source: 'users', field: 'total', targetProp: 'users' },
        { source: 'context', field: 'value', targetProp: 'ctx' },
      ]

      const sources = extractDataSources(bindings)
      expect(sources).toEqual(['tickets', 'users'])
      expect(sources).not.toContain('context')
    })

    it('should return empty array for no bindings', () => {
      expect(extractDataSources([])).toEqual([])
    })
  })

  describe('validateBindings', () => {
    it('should validate valid bindings', () => {
      const bindings: DataBinding[] = [
        { source: 'tickets', field: 'openCount', targetProp: 'count' },
      ]

      const result = validateBindings(bindings)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject bindings without source', () => {
      const bindings: DataBinding[] = [
        { source: '', field: 'value', targetProp: 'result' } as any,
      ]

      const result = validateBindings(bindings)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('source'))
    })

    it('should reject bindings without field', () => {
      const bindings: DataBinding[] = [
        { source: 'tickets', field: '', targetProp: 'result' } as any,
      ]

      const result = validateBindings(bindings)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('field'))
    })

    it('should reject bindings without targetProp', () => {
      const bindings: DataBinding[] = [
        { source: 'tickets', field: 'value', targetProp: '' } as any,
      ]

      const result = validateBindings(bindings)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('targetProp'))
    })

    it('should validate transform expressions', () => {
      const bindings: DataBinding[] = [
        {
          source: 'tickets',
          field: 'count',
          targetProp: 'result',
          transform: 'invalid expression (((',
        },
      ]

      const result = validateBindings(bindings)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should accept valid transform expressions', () => {
      const bindings: DataBinding[] = [
        {
          source: 'tickets',
          field: 'count',
          targetProp: 'result',
          transform: 'data.value * 2',
        },
      ]

      const result = validateBindings(bindings)
      expect(result.valid).toBe(true)
    })
  })

  describe('createBinding', () => {
    it('should create binding configuration', () => {
      const binding = createBinding('tickets', 'openCount', 'count')
      expect(binding).toEqual({
        source: 'tickets',
        field: 'openCount',
        targetProp: 'count',
      })
    })

    it('should create binding with transform', () => {
      const binding = createBinding('tickets', 'openCount', 'count', 'data.value * 2')
      expect(binding).toEqual({
        source: 'tickets',
        field: 'openCount',
        targetProp: 'count',
        transform: 'data.value * 2',
      })
    })
  })

  describe('mergeBindings', () => {
    it('should merge multiple binding results', () => {
      const result1 = { a: 1, b: 2 }
      const result2 = { c: 3, d: 4 }
      const result3 = { e: 5 }

      const merged = mergeBindings(result1, result2, result3)
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 })
    })

    it('should handle overlapping keys (last wins)', () => {
      const result1 = { a: 1, b: 2 }
      const result2 = { b: 3, c: 4 }

      const merged = mergeBindings(result1, result2)
      expect(merged).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should handle empty results', () => {
      expect(mergeBindings({}, {}, {})).toEqual({})
    })
  })

  describe('field path resolution', () => {
    it('should handle dot notation', () => {
      const binding: DataBinding = {
        source: 'tickets',
        field: 'items[0].title',
        targetProp: 'title',
      }

      const result = resolver.resolveBinding(binding, dataContext, user, env)
      expect(result).toBe('Ticket 1')
    })

    it('should handle array indexing', () => {
      const binding: DataBinding = {
        source: 'tickets',
        field: 'items[1].id',
        targetProp: 'id',
      }

      const result = resolver.resolveBinding(binding, dataContext, user, env)
      expect(result).toBe(2)
    })

    it('should return undefined for invalid paths', () => {
      const binding: DataBinding = {
        source: 'tickets',
        field: 'nonexistent.path',
        targetProp: 'result',
      }

      const result = resolver.resolveBinding(binding, dataContext, user, env)
      expect(result).toBe(undefined)
    })

    it('should return whole object when field is empty', () => {
      const binding: DataBinding = {
        source: 'tickets',
        field: '',
        targetProp: 'all',
      }

      const result = resolver.resolveBinding(binding, dataContext, user, env)
      expect(result).toEqual(dataContext.tickets)
    })
  })
})
