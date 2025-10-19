import { Session } from 'next-auth'
import { PermissionService } from '@/lib/services/permissions'

/**
 * Portal Permission Checking Utilities
 *
 * These functions check if a user has the required permissions to perform
 * portal composer actions. All checks are multi-tenant aware.
 */

/**
 * Check if user has permission to edit portal pages
 */
export async function canEditPortal(session: Session | null): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for portal.edit permission
  return await PermissionService.hasAnyPermission(
    session.user.id,
    session.user.orgId,
    ['portal.edit', 'portal.create', 'portal.view']
  )
}

/**
 * Check if user has permission to publish pages
 */
export async function canPublishPage(session: Session | null): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for portal.publish permission
  return await PermissionService.hasPermission(
    session.user.id,
    session.user.orgId,
    'portal.publish'
  )
}

/**
 * Check if user has permission to delete a specific page
 */
export async function canDeletePage(
  session: Session | null,
  pageId: string
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for portal.delete permission
  return await PermissionService.hasPermission(
    session.user.id,
    session.user.orgId,
    'portal.delete'
  )
}

/**
 * Check if user has permission to access a specific data source
 */
export async function canAccessDataSource(
  session: Session | null,
  sourceId: string
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for portal.datasource.edit permission
  return await PermissionService.hasPermission(
    session.user.id,
    session.user.orgId,
    'portal.datasource.edit'
  )
}

/**
 * Check if user has permission to edit themes
 */
export async function canEditTheme(session: Session | null): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for portal.theme.edit permission
  return await PermissionService.hasPermission(
    session.user.id,
    session.user.orgId,
    'portal.theme.edit'
  )
}

/**
 * Check if user has permission to create pages
 */
export async function canCreatePage(session: Session | null): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for portal.create permission
  return await PermissionService.hasPermission(
    session.user.id,
    session.user.orgId,
    'portal.create'
  )
}

/**
 * Check if user has permission to view portal composer
 */
export async function canViewPortalComposer(session: Session | null): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Check for any portal permission
  return await PermissionService.hasAnyPermission(
    session.user.id,
    session.user.orgId,
    [
      'portal.view',
      'portal.create',
      'portal.edit',
      'portal.publish',
      'portal.delete',
      'portal.theme.edit',
      'portal.datasource.edit',
    ]
  )
}

/**
 * Get all portal permissions for a user
 */
export async function getPortalPermissions(
  session: Session | null
): Promise<string[]> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return []
  }

  const allPermissions = await PermissionService.getUserPermissions(
    session.user.id,
    session.user.orgId
  )

  // Filter to only portal permissions
  return allPermissions.filter((perm) => perm.startsWith('portal.'))
}

/**
 * Check if user has all required permissions (AND logic)
 */
export async function hasAllPortalPermissions(
  session: Session | null,
  permissions: string[]
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  return await PermissionService.hasAllPermissions(
    session.user.id,
    session.user.orgId,
    permissions
  )
}

/**
 * Check if user has any of the required permissions (OR logic)
 */
export async function hasAnyPortalPermission(
  session: Session | null,
  permissions: string[]
): Promise<boolean> {
  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  return await PermissionService.hasAnyPermission(
    session.user.id,
    session.user.orgId,
    permissions
  )
}
