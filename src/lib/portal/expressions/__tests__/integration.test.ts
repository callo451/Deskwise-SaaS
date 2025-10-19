/**
 * Integration Tests
 *
 * Tests that verify the complete expression system working together.
 */

import { ExpressionEvaluator } from '../evaluator'
import { BindingResolver } from '../bindings'
import { GuardEvaluator, Guards } from '../guards'
import { EvaluationContext, DataBinding, VisibilityGuard } from '../types'

describe('Expression System Integration', () => {
  let context: EvaluationContext

  beforeEach(() => {
    context = {
      data: {
        tickets: {
          openCount: 15,
          closedCount: 25,
          priority: {
            high: 5,
            medium: 7,
            low: 3,
          },
        },
        projects: {
          active: 8,
          completed: 12,
        },
      },
      user: {
        id: 'user123',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['tickets.view', 'tickets.edit', 'projects.*'],
        orgUnit: 'engineering',
      },
      env: {
        isDev: true,
        orgId: 'org123',
      },
    }
  })

  describe('Complete workflow', () => {
    it('should evaluate expressions, resolve bindings, and check guards', () => {
      // 1. Evaluate expression
      const evaluator = new ExpressionEvaluator()
      const expr = 'data.tickets.openCount + data.tickets.closedCount'
      const total = evaluator.evaluate(expr, context)
      expect(total).toBe(40)

      // 2. Resolve bindings
      const resolver = new BindingResolver()
      const bindings: DataBinding[] = [
        {
          source: 'context',
          field: 'tickets.openCount',
          targetProp: 'open',
          transform: 'format("{value} open", data)',
        },
        {
          source: 'context',
          field: 'tickets.closedCount',
          targetProp: 'closed',
        },
      ]
      const resolved = resolver.resolveBindings(bindings, context.data, context.user, context.env)
      expect(resolved).toEqual({
        open: '15 open',
        closed: 25,
      })

      // 3. Check guards
      const guardEvaluator = new GuardEvaluator()
      const guard = Guards.permission('tickets.view')
      const guardResult = guardEvaluator.evaluateGuard(guard, context)
      expect(guardResult.visible).toBe(true)
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle dashboard widget visibility', () => {
      const guardEvaluator = new GuardEvaluator()

      // Widget visible only to admins
      const adminWidget = Guards.adminOnly('Admin access required')
      expect(guardEvaluator.evaluateGuard(adminWidget, context).visible).toBe(true)

      // Widget visible only if there are open tickets
      const ticketWidget: VisibilityGuard = {
        expression: 'data.tickets.openCount > 0',
        fallback: 'hide',
        message: 'No open tickets',
      }
      expect(guardEvaluator.evaluateGuard(ticketWidget, context).visible).toBe(true)

      // Widget with multiple conditions
      const complexWidget: VisibilityGuard = {
        expression:
          'user.role === "admin" && data.tickets.openCount > 10 && includes(user.permissions, "tickets.view")',
      }
      expect(guardEvaluator.evaluateGuard(complexWidget, context).visible).toBe(true)
    })

    it('should handle dynamic data bindings for metrics', () => {
      const resolver = new BindingResolver()

      const bindings: DataBinding[] = [
        {
          source: 'context',
          field: 'tickets.openCount',
          targetProp: 'openTickets',
          transform: 'format("{value} Open Tickets", data)',
        },
        {
          source: 'context',
          field: 'tickets.priority.high',
          targetProp: 'highPriority',
          transform: 'data.value > 3 ? "🔴 " + data.value : "✅ " + data.value',
        },
        {
          source: 'context',
          field: 'projects.active',
          targetProp: 'projectCount',
          transform: 'data.value + " active"',
        },
      ]

      const result = resolver.resolveBindings(bindings, context.data, context.user, context.env)

      expect(result).toEqual({
        openTickets: '15 Open Tickets',
        highPriority: '🔴 5',
        projectCount: '8 active',
      })
    })

    it('should handle permission-based feature flags', () => {
      const guardEvaluator = new GuardEvaluator()

      // Feature requires multiple permissions
      const featureGuards: VisibilityGuard[] = [
        Guards.allPermissions(['tickets.view', 'tickets.edit']),
        Guards.custom('data.tickets.openCount < 100', 'show-message', 'System overloaded'),
      ]

      const result = guardEvaluator.evaluateGuards(featureGuards, context)
      expect(result.visible).toBe(true)
    })

    it('should handle conditional content based on user role and data', () => {
      const evaluator = new ExpressionEvaluator()

      // Show different messages based on role and ticket count
      const message = evaluator.evaluate(
        'user.role === "admin" ? format("Admin: {value} tickets", data.tickets) : format("User: {value} open tickets", data.tickets)',
        context
      )

      expect(message).toContain('Admin:')
    })

    it('should handle complex data transformations', () => {
      const resolver = new BindingResolver()

      const bindings: DataBinding[] = [
        {
          source: 'context',
          field: 'tickets.priority.high',
          targetProp: 'urgentStatus',
          transform:
            'data.value === 0 ? "✅ No urgent tickets" : data.value < 5 ? "⚠️ " + data.value + " urgent" : "🚨 " + data.value + " CRITICAL"',
        },
        {
          source: 'context',
          field: 'projects.active',
          targetProp: 'projectHealth',
          transform:
            'data.value > 10 ? "high" : data.value > 5 ? "medium" : "low"',
        },
        {
          source: 'context',
          field: 'tickets',
          targetProp: 'completionRate',
          transform:
            '(data.value.closedCount / (data.value.openCount + data.value.closedCount) * 100)',
        },
      ]

      const result = resolver.resolveBindings(bindings, context.data, context.user, context.env)

      expect(result.urgentStatus).toBe('🚨 5 CRITICAL')
      expect(result.projectHealth).toBe('medium')
      expect(result.completionRate).toBeCloseTo(62.5, 1)
    })

    it('should handle multi-level guards with fallbacks', () => {
      const guardEvaluator = new GuardEvaluator()

      // Level 1: Authentication
      const authGuard = Guards.authenticated('Please log in')

      // Level 2: Role check
      const roleGuard = Guards.anyRole(['admin', 'manager'], 'Requires admin or manager role')

      // Level 3: Permission check
      const permGuard = Guards.permission('tickets.edit', 'No edit permission')

      // Level 4: Data condition
      const dataGuard: VisibilityGuard = {
        expression: 'data.tickets.openCount < 50',
        fallback: 'show-message',
        message: 'Too many open tickets to perform this action',
      }

      const guards = [authGuard, roleGuard, permGuard, dataGuard]
      const result = guardEvaluator.evaluateGuards(guards, context)

      expect(result.visible).toBe(true)
    })

    it('should handle dynamic threshold calculations', () => {
      const evaluator = new ExpressionEvaluator()

      // Calculate if ticket workload is high
      const isHighWorkload = evaluator.evaluate(
        'data.tickets.openCount > (data.tickets.closedCount * 0.5)',
        context
      )

      expect(isHighWorkload).toBe(true) // 15 > (25 * 0.5 = 12.5)

      // Calculate capacity percentage
      const capacityPercent = evaluator.evaluate(
        '(data.projects.active / (data.projects.active + data.projects.completed)) * 100',
        context
      )

      expect(capacityPercent).toBeCloseTo(40, 0)
    })

    it('should handle user-specific customizations', () => {
      const resolver = new BindingResolver()

      const bindings: DataBinding[] = [
        {
          source: 'context',
          field: 'tickets.openCount',
          targetProp: 'displayValue',
          transform:
            'user.role === "admin" ? format("All: {value}", data) : format("Your team: {value}", data)',
        },
        {
          source: 'context',
          field: 'projects.active',
          targetProp: 'projectLabel',
          transform: 'user.orgUnit + " Projects: " + data.value',
        },
      ]

      const result = resolver.resolveBindings(bindings, context.data, context.user, context.env)

      expect(result.displayValue).toBe('All: 15')
      expect(result.projectLabel).toBe('engineering Projects: 8')
    })

    it('should handle time-sensitive guards', () => {
      const guardEvaluator = new GuardEvaluator()

      // Only show in dev mode
      const devGuard = Guards.devMode('Feature in development')
      expect(guardEvaluator.evaluateGuard(devGuard, context).visible).toBe(true)

      // Production context
      const prodContext = {
        ...context,
        env: { ...context.env, isDev: false },
      }
      expect(guardEvaluator.evaluateGuard(devGuard, prodContext).visible).toBe(false)
    })

    it('should handle nested data with array operations', () => {
      const contextWithArrays = {
        ...context,
        data: {
          ...context.data,
          recentTickets: [
            { id: 1, priority: 'high', assignee: 'user1' },
            { id: 2, priority: 'low', assignee: 'user2' },
            { id: 3, priority: 'high', assignee: 'user1' },
          ],
        },
      }

      const resolver = new BindingResolver()

      const bindings: DataBinding[] = [
        {
          source: 'context',
          field: 'recentTickets',
          targetProp: 'ticketCount',
          transform: 'len(data.value)',
        },
      ]

      const result = resolver.resolveBindings(
        bindings,
        contextWithArrays.data,
        context.user,
        context.env
      )

      expect(result.ticketCount).toBe(3)
    })
  })

  describe('Security validation', () => {
    it('should block access to dangerous properties across all components', () => {
      const evaluator = new ExpressionEvaluator()

      expect(() => evaluator.evaluate('user.__proto__', context)).toThrow()
      expect(() => evaluator.evaluate('user.constructor', context)).toThrow()
      expect(() => evaluator.evaluate('data.prototype', context)).toThrow()
    })

    it('should block global object access in all components', () => {
      const evaluator = new ExpressionEvaluator()

      expect(() => evaluator.evaluate('window.location', context)).toThrow()
      expect(() => evaluator.evaluate('document.cookie', context)).toThrow()
      expect(() => evaluator.evaluate('process.env', context)).toThrow()
    })

    it('should block function construction in all components', () => {
      const evaluator = new ExpressionEvaluator()

      expect(() => evaluator.evaluate('Function("return 1")', context)).toThrow()
      expect(() => evaluator.evaluate('eval("1")', context)).toThrow()
    })

    it('should enforce expression depth limits', () => {
      const evaluator = new ExpressionEvaluator()

      // Create very deep nesting
      let deepExpr = 'data.a'
      for (let i = 0; i < 15; i++) {
        deepExpr += `.b${i}`
      }

      expect(() => evaluator.evaluate(deepExpr, context)).toThrow()
    })
  })

  describe('Error handling and resilience', () => {
    it('should handle null/undefined gracefully', () => {
      const evaluator = new ExpressionEvaluator()

      context.data = { value: null }

      expect(evaluator.evaluate('data.value', context)).toBe(null)
      expect(evaluator.evaluate('isEmpty(data.value)', context)).toBe(true)
      expect(evaluator.evaluate('default(data.value, "fallback")', context)).toBe('fallback')
    })

    it('should continue binding resolution on partial failures', () => {
      const resolver = new BindingResolver()

      const bindings: DataBinding[] = [
        { source: 'context', field: 'tickets.openCount', targetProp: 'open' },
        { source: 'invalid', field: 'value', targetProp: 'error' }, // This will fail
        { source: 'context', field: 'projects.active', targetProp: 'projects' },
      ]

      const result = resolver.resolveBindings(bindings, context.data, context.user, context.env)

      expect(result.open).toBe(15)
      expect(result.error).toBe(undefined)
      expect(result.projects).toBe(8)
    })

    it('should handle guard evaluation errors gracefully', () => {
      const guardEvaluator = new GuardEvaluator()

      const guard: VisibilityGuard = {
        expression: 'invalid.expression.that.does.not.exist',
        fallback: 'hide',
        message: 'Error message',
      }

      const result = guardEvaluator.evaluateGuard(guard, context)

      // Should default to hiding on error
      expect(result.visible).toBe(false)
      expect(result.fallback).toBe('hide')
    })
  })
})
