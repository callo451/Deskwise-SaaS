import { Session } from 'next-auth'
import { PermissionService } from '@/lib/services/permissions'

/**
 * Permission Middleware
 *
 * Provides utility functions for checking permissions in API routes.
 * These functions work with NextAuth sessions and the RBAC permission system.
 */

/**
 * Check if the current session has a specific permission
 *
 * @param session - NextAuth session
 * @param permission - Permission key to check (e.g., 'tickets.view')
 * @returns True if user has the permission
 *
 * @example
 * const session = await getServerSession(authOptions)
 * if (!await requirePermission(session, 'tickets.view')) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 * }
 */
export async function requirePermission(
  session: Session | null,
  permission: string
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check if permissions are cached in session
  if (session.user.permissions && Array.isArray(session.user.permissions)) {
    return session.user.permissions.includes(permission)
  }

  // Fallback: fetch from database
  return await PermissionService.hasPermission(
    session.user.id,
    session.user.orgId,
    permission
  )
}

/**
 * Check if the current session has ANY of the specified permissions (OR logic)
 *
 * @param session - NextAuth session
 * @param permissions - Array of permission keys
 * @returns True if user has at least one permission
 *
 * @example
 * const session = await getServerSession(authOptions)
 * if (!await requireAnyPermission(session, ['tickets.edit.all', 'tickets.edit.own'])) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 * }
 */
export async function requireAnyPermission(
  session: Session | null,
  permissions: string[]
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check if permissions are cached in session
  if (session.user.permissions && Array.isArray(session.user.permissions)) {
    const userPermSet = new Set(session.user.permissions)
    return permissions.some((perm) => userPermSet.has(perm))
  }

  // Fallback: fetch from database
  return await PermissionService.hasAnyPermission(
    session.user.id,
    session.user.orgId,
    permissions
  )
}

/**
 * Check if the current session has ALL of the specified permissions (AND logic)
 *
 * @param session - NextAuth session
 * @param permissions - Array of permission keys
 * @returns True if user has all permissions
 *
 * @example
 * const session = await getServerSession(authOptions)
 * if (!await requireAllPermissions(session, ['users.view', 'users.edit'])) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 * }
 */
export async function requireAllPermissions(
  session: Session | null,
  permissions: string[]
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check if permissions are cached in session
  if (session.user.permissions && Array.isArray(session.user.permissions)) {
    const userPermSet = new Set(session.user.permissions)
    return permissions.every((perm) => userPermSet.has(perm))
  }

  // Fallback: fetch from database
  return await PermissionService.hasAllPermissions(
    session.user.id,
    session.user.orgId,
    permissions
  )
}

/**
 * Check if the current session has admin role
 * This is a convenience function for backward compatibility
 *
 * @param session - NextAuth session
 * @returns True if user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'admin'
}

/**
 * Check if the current session has admin or technician role
 * This is a convenience function for backward compatibility
 *
 * @param session - NextAuth session
 * @returns True if user is admin or technician
 */
export function isAdminOrTechnician(session: Session | null): boolean {
  return session?.user?.role === 'admin' || session?.user?.role === 'technician'
}

/**
 * Get all permissions for the current session user
 *
 * @param session - NextAuth session
 * @returns Array of permission keys
 */
export async function getUserPermissions(session: Session | null): Promise<string[]> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return []
  }

  // Return cached permissions if available
  if (session.user.permissions && Array.isArray(session.user.permissions)) {
    return session.user.permissions
  }

  // Fetch from database
  return await PermissionService.getUserPermissions(
    session.user.id,
    session.user.orgId
  )
}

/**
 * Create a permission error response helper
 *
 * @param permission - Permission that was required
 * @returns Error message string
 */
export function createPermissionError(permission: string): string {
  return `Insufficient permissions. Required: ${permission}`
}

/**
 * Create a permission error response helper for multiple permissions
 *
 * @param permissions - Permissions that were required
 * @param requireAll - Whether all permissions are required (AND) or any (OR)
 * @returns Error message string
 */
export function createMultiplePermissionError(
  permissions: string[],
  requireAll: boolean = true
): string {
  const logic = requireAll ? 'all' : 'any'
  return `Insufficient permissions. Required (${logic}): ${permissions.join(', ')}`
}
