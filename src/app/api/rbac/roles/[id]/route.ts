import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RoleService } from '@/lib/services/roles'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const updateRoleSchema = z.object({
  displayName: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

/**
 * GET /api/rbac/roles/[id]
 * Get a specific role by ID
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

    // Check permission
    if (!(await requirePermission(session, 'roles.view'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view roles' },
        { status: 403 }
      )
    }

    const { id } = await params
    const role = await RoleService.getRole(session.user.orgId, id)

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: role,
    })
  } catch (error) {
    console.error('Get role error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/rbac/roles/[id]
 * Update a role (admin only, cannot update system roles)
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
    if (!(await requirePermission(session, 'roles.edit'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to edit roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)
    const { id } = await params

    const role = await RoleService.updateRole(
      session.user.orgId,
      id,
      validatedData
    )

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role updated successfully',
    })
  } catch (error) {
    console.error('Update role error:', error)

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
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rbac/roles/[id]
 * Delete a role (admin only, cannot delete system roles or roles with users)
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
    if (!(await requirePermission(session, 'roles.delete'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete roles' },
        { status: 403 }
      )
    }

    const { id } = await params
    const success = await RoleService.deleteRole(session.user.orgId, id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete role' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    })
  } catch (error) {
    console.error('Delete role error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
