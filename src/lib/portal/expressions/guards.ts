/**
 * Guard System
 *
 * Evaluates visibility guards and access control expressions.
 */

import { VisibilityGuard, EvaluationContext } from './types'
import { ExpressionEvaluator } from './evaluator'

/**
 * Guard evaluation result
 */
export interface GuardResult {
  visible: boolean
  fallback?: 'hide' | 'show-message' | 'redirect'
  message?: string
}

/**
 * Guard evaluation error
 */
export class GuardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GuardError'
  }
}

/**
 * Guard Evaluator
 */
export class GuardEvaluator {
  private evaluator: ExpressionEvaluator

  constructor() {
    this.evaluator = new ExpressionEvaluator()
  }

  /**
   * Evaluate a visibility guard
   */
  evaluateGuard(guard: VisibilityGuard, context: EvaluationContext): GuardResult {
    try {
      // Evaluate the guard expression
      const result = this.evaluator.evaluate(guard.expression, context)

      // Convert result to boolean
      const visible = Boolean(result)

      return {
        visible,
        fallback: visible ? undefined : guard.fallback,
        message: visible ? undefined : guard.message,
      }
    } catch (error) {
      console.error('Guard evaluation failed:', error)

      // On error, default to hiding the content
      return {
        visible: false,
        fallback: guard.fallback || 'hide',
        message: guard.message || 'Access denied',
      }
    }
  }

  /**
   * Evaluate multiple guards (all must pass)
   */
  evaluateGuards(guards: VisibilityGuard[], context: EvaluationContext): GuardResult {
    if (guards.length === 0) {
      return { visible: true }
    }

    for (const guard of guards) {
      const result = this.evaluateGuard(guard, context)
      if (!result.visible) {
        return result
      }
    }

    return { visible: true }
  }

  /**
   * Check if user has specific permission
   */
  checkPermission(permission: string, context: EvaluationContext): boolean {
    if (!context.user?.permissions) {
      return false
    }

    // Check for exact permission match
    if (context.user.permissions.includes(permission)) {
      return true
    }

    // Check for wildcard permissions (e.g., "tickets.*")
    const permissionParts = permission.split('.')
    for (const userPerm of context.user.permissions) {
      if (userPerm === '*' || userPerm === '*.*') {
        return true // User has all permissions
      }

      const userPermParts = userPerm.split('.')
      if (userPermParts[userPermParts.length - 1] === '*') {
        // Check if prefix matches
        const prefix = userPermParts.slice(0, -1).join('.')
        const permPrefix = permissionParts.slice(0, userPermParts.length - 1).join('.')
        if (prefix === permPrefix) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Check if user has any of the specified roles
   */
  checkRole(roles: string[], context: EvaluationContext): boolean {
    if (!context.user?.role) {
      return false
    }

    return roles.includes(context.user.role)
  }

  /**
   * Check if user is in specific org unit
   */
  checkOrgUnit(orgUnits: string[], context: EvaluationContext): boolean {
    if (!context.user?.orgUnit) {
      return false
    }

    return orgUnits.includes(context.user.orgUnit)
  }
}

/**
 * Quick guard evaluation helper
 */
export function evaluateGuard(guard: VisibilityGuard, context: EvaluationContext): GuardResult {
  const evaluator = new GuardEvaluator()
  return evaluator.evaluateGuard(guard, context)
}

/**
 * Create common guard expressions
 */
export const Guards = {
  /**
   * Role-based guard
   */
  role(role: string, message?: string): VisibilityGuard {
    return {
      expression: `user.role === "${role}"`,
      fallback: 'hide',
      message: message || `Only ${role}s can view this content`,
    }
  },

  /**
   * Multiple roles guard (any match)
   */
  anyRole(roles: string[], message?: string): VisibilityGuard {
    const conditions = roles.map(role => `user.role === "${role}"`).join(' || ')
    return {
      expression: conditions,
      fallback: 'hide',
      message: message || `Only ${roles.join(', ')} can view this content`,
    }
  },

  /**
   * Permission-based guard
   */
  permission(permission: string, message?: string): VisibilityGuard {
    return {
      expression: `includes(user.permissions, "${permission}")`,
      fallback: 'hide',
      message: message || 'You do not have permission to view this content',
    }
  },

  /**
   * Multiple permissions guard (all required)
   */
  allPermissions(permissions: string[], message?: string): VisibilityGuard {
    const conditions = permissions.map(perm => `includes(user.permissions, "${perm}")`).join(' && ')
    return {
      expression: conditions,
      fallback: 'hide',
      message: message || 'You do not have the required permissions',
    }
  },

  /**
   * Any permission guard (at least one required)
   */
  anyPermission(permissions: string[], message?: string): VisibilityGuard {
    const conditions = permissions.map(perm => `includes(user.permissions, "${perm}")`).join(' || ')
    return {
      expression: conditions,
      fallback: 'hide',
      message: message || 'You do not have any of the required permissions',
    }
  },

  /**
   * Admin only guard
   */
  adminOnly(message?: string): VisibilityGuard {
    return {
      expression: 'user.role === "admin"',
      fallback: 'hide',
      message: message || 'Admin access required',
    }
  },

  /**
   * Authenticated user guard
   */
  authenticated(message?: string): VisibilityGuard {
    return {
      expression: 'not(isEmpty(user.id))',
      fallback: 'redirect',
      message: message || 'You must be logged in',
    }
  },

  /**
   * Org unit guard
   */
  orgUnit(orgUnit: string, message?: string): VisibilityGuard {
    return {
      expression: `user.orgUnit === "${orgUnit}"`,
      fallback: 'hide',
      message: message || `Only ${orgUnit} members can view this content`,
    }
  },

  /**
   * Development mode only
   */
  devMode(message?: string): VisibilityGuard {
    return {
      expression: 'env.isDev === true',
      fallback: 'hide',
      message: message || 'This feature is only available in development mode',
    }
  },

  /**
   * Custom expression guard
   */
  custom(expression: string, fallback?: 'hide' | 'show-message' | 'redirect', message?: string): VisibilityGuard {
    return {
      expression,
      fallback,
      message,
    }
  },
}

/**
 * Validate guard configuration
 */
export function validateGuard(guard: VisibilityGuard): { valid: boolean; error?: string } {
  if (!guard.expression) {
    return { valid: false, error: 'Guard expression is required' }
  }

  const evaluator = new ExpressionEvaluator()
  return evaluator.validateExpression(guard.expression)
}

/**
 * Validate multiple guards
 */
export function validateGuards(guards: VisibilityGuard[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (let i = 0; i < guards.length; i++) {
    const guard = guards[i]
    const validation = validateGuard(guard)
    if (!validation.valid) {
      errors.push(`Guard ${i}: ${validation.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
