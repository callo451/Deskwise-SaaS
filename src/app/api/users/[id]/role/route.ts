import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RoleService } from '@/lib/services/roles'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const assignRoleSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  reason: z.string().optional(),
})

/**
 * PUT /api/users/[id]/role
 * Assign a role to a user (admin only)
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
    if (!(await requirePermission(session, 'roles.assign'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to assign roles' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = assignRoleSchema.parse(body)

    const success = await RoleService.assignRoleToUser(
      id,
      session.user.orgId,
      validatedData.roleId,
      session.user.id,
      validatedData.reason
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign role' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role assigned successfully',
    })
  } catch (error) {
    console.error('Assign role error:', error)

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
      { success: false, error: 'Failed to assign role' },
      { status: 500 }
    )
  }
}
