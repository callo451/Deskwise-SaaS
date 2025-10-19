import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PermissionService } from '@/lib/services/permissions'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const permissionOverrideSchema = z.object({
  permissionKey: z.string().min(1, 'Permission key is required'),
  granted: z.boolean(),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().optional(),
})

/**
 * GET /api/users/[id]/permissions
 * Get user's effective permissions (role + custom + overrides)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Users can view their own permissions, or admins can view anyone's
    const isOwnPermissions = session.user.id === id
    const canViewOthers = await requirePermission(session, 'users.view')

    if (!isOwnPermissions && !canViewOthers) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view user permissions' },
        { status: 403 }
      )
    }

    const permissions = await PermissionService.getUserPermissions(
      id,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: {
        userId: id,
        permissions,
        count: permissions.length,
      },
    })
  } catch (error) {
    console.error('Get user permissions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user permissions' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]/permissions
 * Update user permission overrides (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    if (!(await requirePermission(session, 'users.manage'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to manage user permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = permissionOverrideSchema.parse(body)

    if (validatedData.granted) {
      // Grant permission
      await PermissionService.grantPermissionToUser(
        id,
        session.user.orgId,
        validatedData.permissionKey,
        session.user.id,
        validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        validatedData.reason
      )
    } else {
      // Revoke permission
      await PermissionService.revokePermissionFromUser(
        id,
        session.user.orgId,
        validatedData.permissionKey,
        session.user.id,
        validatedData.reason
      )
    }

    // Get updated permissions
    const updatedPermissions = await PermissionService.getUserPermissions(
      id,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: {
        userId: id,
        permissions: updatedPermissions,
      },
      message: `Permission ${validatedData.granted ? 'granted' : 'revoked'} successfully`,
    })
  } catch (error) {
    console.error('Update user permissions error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user permissions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]/permissions
 * Clear all permission overrides for a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    if (!(await requirePermission(session, 'users.manage'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to manage user permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    await PermissionService.clearUserPermissionOverrides(id, session.user.orgId)

    return NextResponse.json({
      success: true,
      message: 'All permission overrides cleared successfully',
    })
  } catch (error) {
    console.error('Clear user permissions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear user permissions' },
      { status: 500 }
    )
  }
}
