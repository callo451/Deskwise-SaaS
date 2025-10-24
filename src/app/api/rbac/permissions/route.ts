import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PermissionService } from '@/lib/services/permissions'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/rbac/permissions
 * Get all available permissions in the organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    if (!(await requirePermission(session, 'roles.view'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupByModule = searchParams.get('groupByModule') === 'true'

    if (groupByModule) {
      const permissionsByModule = await PermissionService.getPermissionsByModule(
        session.user.orgId
      )
      return NextResponse.json({
        success: true,
        data: permissionsByModule,
      })
    } else {
      const permissions = await PermissionService.getAllPermissions(session.user.orgId)
      return NextResponse.json({
        success: true,
        data: permissions,
      })
    }
  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rbac/permissions/seed
 * Seed default permissions (admin only)
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

    // Only admins can seed permissions
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const count = await PermissionService.seedDefaultPermissions(session.user.orgId)

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${count} permissions`,
      data: { count },
    })
  } catch (error) {
    console.error('Seed permissions error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to seed permissions' },
      { status: 500 }
    )
  }
}
