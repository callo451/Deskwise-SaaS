import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PermissionService } from '@/lib/services/permissions'
import { RoleService } from '@/lib/services/roles'

/**
 * POST /api/rbac/seed
 * Seed default permissions and roles for an organization (admin only)
 *
 * This endpoint creates:
 * - All default permissions (tickets, assets, users, etc.)
 * - Default roles (admin, technician, user) with appropriate permissions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can seed RBAC data
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    let permissionsCount = 0
    let rolesCount = 0
    const results: string[] = []

    // Seed permissions
    try {
      permissionsCount = await PermissionService.seedDefaultPermissions(session.user.orgId)
      results.push(`✓ Created ${permissionsCount} permissions`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exist')) {
        results.push('ℹ Permissions already exist, skipping...')
      } else {
        throw error
      }
    }

    // Seed roles
    try {
      rolesCount = await RoleService.seedDefaultRoles(session.user.orgId)
      results.push(`✓ Created ${rolesCount} default roles (admin, technician, user)`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exist')) {
        results.push('ℹ Roles already exist, skipping...')
      } else {
        throw error
      }
    }

    // Migrate existing users to RBAC
    try {
      const migratedCount = await RoleService.migrateUsersToRBAC(session.user.orgId)
      if (migratedCount > 0) {
        results.push(`✓ Migrated ${migratedCount} users to RBAC system`)
      } else {
        results.push('ℹ All users already using RBAC system')
      }
    } catch (error) {
      if (error instanceof Error) {
        results.push(`⚠ User migration: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'RBAC system seeded successfully',
      data: {
        permissionsCreated: permissionsCount,
        rolesCreated: rolesCount,
        results,
      },
    })
  } catch (error) {
    console.error('Seed RBAC error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to seed RBAC system' },
      { status: 500 }
    )
  }
}
