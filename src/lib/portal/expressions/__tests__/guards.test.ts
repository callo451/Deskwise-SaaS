/**
 * Guards Tests
 */

import {
  GuardEvaluator,
  Guards,
  evaluateGuard,
  validateGuard,
  validateGuards,
} from '../guards'
import { VisibilityGuard, EvaluationContext } from '../types'

describe('Guard System', () => {
  let evaluator: GuardEvaluator
  let context: EvaluationContext

  beforeEach(() => {
    evaluator = new GuardEvaluator()
    context = {
      data: {
        count: 10,
      },
      user: {
        id: 'user123',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['tickets.view', 'tickets.edit', 'users.*'],
        orgUnit: 'engineering',
      },
      env: {
        isDev: true,
        orgId: 'org123',
      },
    }
  })

  describe('GuardEvaluator', () => {
    describe('evaluateGuard', () => {
      it('should return visible when guard passes', () => {
        const guard: VisibilityGuard = {
          expression: 'user.role === "admin"',
        }

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
        expect(result.fallback).toBe(undefined)
        expect(result.message).toBe(undefined)
      })

      it('should return not visible when guard fails', () => {
        const guard: VisibilityGuard = {
          expression: 'user.role === "superadmin"',
          fallback: 'hide',
          message: 'Access denied',
        }

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(false)
        expect(result.fallback).toBe('hide')
        expect(result.message).toBe('Access denied')
      })

      it('should handle complex expressions', () => {
        const guard: VisibilityGuard = {
          expression: 'user.role === "admin" && data.count > 5',
        }

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should handle permission checks', () => {
        const guard: VisibilityGuard = {
          expression: 'includes(user.permissions, "tickets.view")',
        }

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should default to hiding on error', () => {
        const guard: VisibilityGuard = {
          expression: 'invalid expression (((',
          fallback: 'show-message',
          message: 'Error occurred',
        }

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(false)
        expect(result.fallback).toBe('show-message')
      })
    })

    describe('evaluateGuards', () => {
      it('should return visible when no guards', () => {
        const result = evaluator.evaluateGuards([], context)
        expect(result.visible).toBe(true)
      })

      it('should return visible when all guards pass', () => {
        const guards: VisibilityGuard[] = [
          { expression: 'user.role === "admin"' },
          { expression: 'data.count > 5' },
          { expression: 'env.isDev === true' },
        ]

        const result = evaluator.evaluateGuards(guards, context)
        expect(result.visible).toBe(true)
      })

      it('should return not visible if any guard fails', () => {
        const guards: VisibilityGuard[] = [
          { expression: 'user.role === "admin"' },
          { expression: 'data.count > 100', fallback: 'hide', message: 'Count too low' },
          { expression: 'env.isDev === true' },
        ]

        const result = evaluator.evaluateGuards(guards, context)
        expect(result.visible).toBe(false)
        expect(result.fallback).toBe('hide')
        expect(result.message).toBe('Count too low')
      })
    })

    describe('checkPermission', () => {
      it('should check exact permission match', () => {
        expect(evaluator.checkPermission('tickets.view', context)).toBe(true)
        expect(evaluator.checkPermission('tickets.delete', context)).toBe(false)
      })

      it('should handle wildcard permissions', () => {
        expect(evaluator.checkPermission('users.view', context)).toBe(true)
        expect(evaluator.checkPermission('users.create', context)).toBe(true)
        expect(evaluator.checkPermission('users.delete', context)).toBe(true)
      })

      it('should handle global wildcard', () => {
        const globalContext = {
          ...context,
          user: { ...context.user, permissions: ['*'] },
        }

        expect(evaluator.checkPermission('any.permission', globalContext)).toBe(true)
      })

      it('should return false when no permissions', () => {
        const noPermContext = {
          ...context,
          user: { ...context.user, permissions: [] },
        }

        expect(evaluator.checkPermission('tickets.view', noPermContext)).toBe(false)
      })
    })

    describe('checkRole', () => {
      it('should check if user has role', () => {
        expect(evaluator.checkRole(['admin'], context)).toBe(true)
        expect(evaluator.checkRole(['admin', 'user'], context)).toBe(true)
        expect(evaluator.checkRole(['user'], context)).toBe(false)
      })

      it('should return false when no role', () => {
        const noRoleContext = {
          ...context,
          user: { ...context.user, role: '' },
        }

        expect(evaluator.checkRole(['admin'], noRoleContext)).toBe(false)
      })
    })

    describe('checkOrgUnit', () => {
      it('should check if user is in org unit', () => {
        expect(evaluator.checkOrgUnit(['engineering'], context)).toBe(true)
        expect(evaluator.checkOrgUnit(['engineering', 'sales'], context)).toBe(true)
        expect(evaluator.checkOrgUnit(['sales'], context)).toBe(false)
      })

      it('should return false when no org unit', () => {
        const noOrgContext = {
          ...context,
          user: { ...context.user, orgUnit: undefined },
        }

        expect(evaluator.checkOrgUnit(['engineering'], noOrgContext)).toBe(false)
      })
    })
  })

  describe('Guards helpers', () => {
    describe('role', () => {
      it('should create role guard', () => {
        const guard = Guards.role('admin')
        expect(guard.expression).toBe('user.role === "admin"')
        expect(guard.fallback).toBe('hide')

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should use custom message', () => {
        const guard = Guards.role('admin', 'Custom message')
        expect(guard.message).toBe('Custom message')
      })
    })

    describe('anyRole', () => {
      it('should create multi-role guard', () => {
        const guard = Guards.anyRole(['admin', 'manager'])
        expect(guard.expression).toBe('user.role === "admin" || user.role === "manager"')

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })
    })

    describe('permission', () => {
      it('should create permission guard', () => {
        const guard = Guards.permission('tickets.view')
        expect(guard.expression).toBe('includes(user.permissions, "tickets.view")')

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })
    })

    describe('allPermissions', () => {
      it('should create guard requiring all permissions', () => {
        const guard = Guards.allPermissions(['tickets.view', 'tickets.edit'])
        expect(guard.expression).toContain('&&')

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should fail if any permission missing', () => {
        const guard = Guards.allPermissions(['tickets.view', 'tickets.delete'])

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(false)
      })
    })

    describe('anyPermission', () => {
      it('should create guard requiring any permission', () => {
        const guard = Guards.anyPermission(['tickets.view', 'tickets.delete'])
        expect(guard.expression).toContain('||')

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true) // Has tickets.view
      })

      it('should fail if no permissions match', () => {
        const guard = Guards.anyPermission(['projects.view', 'projects.edit'])

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(false)
      })
    })

    describe('adminOnly', () => {
      it('should create admin-only guard', () => {
        const guard = Guards.adminOnly()
        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should fail for non-admin', () => {
        const userContext = {
          ...context,
          user: { ...context.user, role: 'user' },
        }

        const guard = Guards.adminOnly()
        const result = evaluator.evaluateGuard(guard, userContext)
        expect(result.visible).toBe(false)
      })
    })

    describe('authenticated', () => {
      it('should check if user is authenticated', () => {
        const guard = Guards.authenticated()
        expect(guard.expression).toBe('not(isEmpty(user.id))')
        expect(guard.fallback).toBe('redirect')

        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should fail for unauthenticated user', () => {
        const anonContext = {
          ...context,
          user: { ...context.user, id: '' },
        }

        const guard = Guards.authenticated()
        const result = evaluator.evaluateGuard(guard, anonContext)
        expect(result.visible).toBe(false)
      })
    })

    describe('orgUnit', () => {
      it('should create org unit guard', () => {
        const guard = Guards.orgUnit('engineering')
        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should fail for different org unit', () => {
        const guard = Guards.orgUnit('sales')
        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(false)
      })
    })

    describe('devMode', () => {
      it('should check if in development mode', () => {
        const guard = Guards.devMode()
        const result = evaluator.evaluateGuard(guard, context)
        expect(result.visible).toBe(true)
      })

      it('should fail in production', () => {
        const prodContext = {
          ...context,
          env: { ...context.env, isDev: false },
        }

        const guard = Guards.devMode()
        const result = evaluator.evaluateGuard(guard, prodContext)
        expect(result.visible).toBe(false)
      })
    })

    describe('custom', () => {
      it('should create custom guard', () => {
        const guard = Guards.custom(
          'data.count > 5 && user.role === "admin"',
          'show-message',
          'Custom condition failed'
        )

        expect(guard.expression).toBe('data.count > 5 && user.role === "admin"')
        expect(guard.fallback).toBe('show-message')
        expect(guard.message).toBe('Custom condition failed')
      })
    })
  })

  describe('evaluateGuard helper', () => {
    it('should work as a quick helper', () => {
      const guard: VisibilityGuard = {
        expression: 'user.role === "admin"',
      }

      const result = evaluateGuard(guard, context)
      expect(result.visible).toBe(true)
    })
  })

  describe('validateGuard', () => {
    it('should validate valid guards', () => {
      const guard: VisibilityGuard = {
        expression: 'user.role === "admin"',
      }

      const result = validateGuard(guard)
      expect(result.valid).toBe(true)
    })

    it('should reject guards without expression', () => {
      const guard: VisibilityGuard = {
        expression: '',
      }

      const result = validateGuard(guard)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject invalid expressions', () => {
      const guard: VisibilityGuard = {
        expression: 'invalid expression (((',
      }

      const result = validateGuard(guard)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateGuards', () => {
    it('should validate multiple guards', () => {
      const guards: VisibilityGuard[] = [
        { expression: 'user.role === "admin"' },
        { expression: 'data.count > 5' },
      ]

      const result = validateGuards(guards)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should collect all errors', () => {
      const guards: VisibilityGuard[] = [
        { expression: 'invalid (((' },
        { expression: 'user.role === "admin"' },
        { expression: 'another invalid ))' },
      ]

      const result = validateGuards(guards)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(2)
    })
  })
})
