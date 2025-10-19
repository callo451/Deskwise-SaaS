/**
 * Visibility Guard Evaluator for Portal Pages
 * Handles server-side evaluation of visibility guards for blocks
 */

import type { VisibilityGuard, UserRole } from '@/lib/types'

export interface EvaluationContext {
  user?: {
    id: string
    email: string
    role: UserRole
    permissions: string[]
  }
  orgId: string
  dataContext?: Record<string, any>
}

export interface EvaluationResult {
  visible: boolean
  fallbackContent?: string
  reason?: string
}

/**
 * Evaluate visibility guards for a block
 * Returns true if the block should be visible, false otherwise
 */
export function evaluateVisibilityGuards(
  guards: VisibilityGuard[] | undefined,
  context: EvaluationContext
): EvaluationResult {
  // If no guards, block is visible
  if (!guards || guards.length === 0) {
    return { visible: true }
  }

  // Evaluate each guard (all must pass for block to be visible)
  for (const guard of guards) {
    const result = evaluateGuard(guard, context)
    if (!result.visible) {
      return result // Return first failing guard
    }
  }

  // All guards passed
  return { visible: true }
}

/**
 * Evaluate a single visibility guard
 */
function evaluateGuard(
  guard: VisibilityGuard,
  context: EvaluationContext
): EvaluationResult {
  switch (guard.type) {
    case 'authenticated':
      return evaluateAuthenticatedGuard(guard, context)
    case 'role':
      return evaluateRoleGuard(guard, context)
    case 'permission':
      return evaluatePermissionGuard(guard, context)
    case 'custom':
      return evaluateCustomGuard(guard, context)
    default:
      return {
        visible: false,
        fallbackContent: guard.fallbackContent,
        reason: `Unknown guard type: ${guard.type}`
      }
  }
}

/**
 * Evaluate authenticated guard
 */
function evaluateAuthenticatedGuard(
  guard: VisibilityGuard,
  context: EvaluationContext
): EvaluationResult {
  const isAuthenticated = !!context.user

  return {
    visible: isAuthenticated,
    fallbackContent: guard.fallbackContent,
    reason: isAuthenticated ? undefined : 'User is not authenticated'
  }
}

/**
 * Evaluate role-based guard
 */
function evaluateRoleGuard(
  guard: VisibilityGuard,
  context: EvaluationContext
): EvaluationResult {
  if (!context.user) {
    return {
      visible: false,
      fallbackContent: guard.fallbackContent,
      reason: 'User is not authenticated'
    }
  }

  if (!guard.roles || guard.roles.length === 0) {
    return {
      visible: true
    }
  }

  const hasRole = guard.roles.includes(context.user.role)

  return {
    visible: hasRole,
    fallbackContent: guard.fallbackContent,
    reason: hasRole ? undefined : `User role ${context.user.role} not in allowed roles: ${guard.roles.join(', ')}`
  }
}

/**
 * Evaluate permission-based guard
 */
function evaluatePermissionGuard(
  guard: VisibilityGuard,
  context: EvaluationContext
): EvaluationResult {
  if (!context.user) {
    return {
      visible: false,
      fallbackContent: guard.fallbackContent,
      reason: 'User is not authenticated'
    }
  }

  if (!guard.permissions || guard.permissions.length === 0) {
    return {
      visible: true
    }
  }

  // Check if user has ANY of the required permissions
  const hasPermission = guard.permissions.some(permission =>
    context.user!.permissions.includes(permission)
  )

  return {
    visible: hasPermission,
    fallbackContent: guard.fallbackContent,
    reason: hasPermission ? undefined : `User lacks required permissions: ${guard.permissions.join(', ')}`
  }
}

/**
 * Evaluate custom expression guard
 * IMPORTANT: This uses Function() constructor which should only be used with trusted expressions
 */
function evaluateCustomGuard(
  guard: VisibilityGuard,
  context: EvaluationContext
): EvaluationResult {
  if (!guard.expression) {
    return {
      visible: false,
      fallbackContent: guard.fallbackContent,
      reason: 'Custom guard has no expression'
    }
  }

  try {
    // Create a safe evaluation context
    const evalContext = {
      user: context.user,
      orgId: context.orgId,
      data: context.dataContext || {}
    }

    // Evaluate the expression
    // The expression should return a boolean
    const evalFn = new Function('context', `
      const { user, orgId, data } = context;
      return ${guard.expression};
    `)

    const result = evalFn(evalContext)

    if (typeof result !== 'boolean') {
      console.error('Custom guard expression did not return boolean:', result)
      return {
        visible: false,
        fallbackContent: guard.fallbackContent,
        reason: 'Custom expression did not return boolean'
      }
    }

    return {
      visible: result,
      fallbackContent: guard.fallbackContent,
      reason: result ? undefined : 'Custom expression evaluated to false'
    }
  } catch (error) {
    console.error('Error evaluating custom guard:', error)
    return {
      visible: false,
      fallbackContent: guard.fallbackContent,
      reason: `Error evaluating custom expression: ${error}`
    }
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(
  user: EvaluationContext['user'],
  permission: string
): boolean {
  if (!user) return false

  // Admin has all permissions
  if (user.role === 'admin') return true

  // Check if user has the specific permission
  return user.permissions.includes(permission)
}

/**
 * Check if user has role
 */
export function hasRole(
  user: EvaluationContext['user'],
  role: UserRole
): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Check if user is admin
 */
export function isAdmin(user: EvaluationContext['user']): boolean {
  return hasRole(user, 'admin')
}

/**
 * Check if user is technician or admin
 */
export function isTechnicianOrAdmin(user: EvaluationContext['user']): boolean {
  return hasRole(user, 'admin') || hasRole(user, 'technician')
}
