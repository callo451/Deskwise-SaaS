import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RoleService } from '@/lib/services/roles'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const cloneRoleSchema = z.object({
  name: z.string().min(1, 'New role name is required'),
  displayName: z.string().min(1, 'New display name is required'),
})

/**
 * POST /api/rbac/roles/[id]/clone
 * Clone a role (create a copy with a new name)
 */
export async function POST(
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
    if (!(await requirePermission(session, 'roles.create'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = cloneRoleSchema.parse(body)
    const { id } = await params

    const clonedRole = await RoleService.cloneRole(
      session.user.orgId,
      id,
      validatedData.name,
      validatedData.displayName,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: clonedRole,
      message: 'Role cloned successfully',
    })
  } catch (error) {
    console.error('Clone role error:', error)

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
      { success: false, error: 'Failed to clone role' },
      { status: 500 }
    )
  }
}
