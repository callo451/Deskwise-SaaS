import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { RoleService } from '@/lib/services/roles'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().min(1, 'Description is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  color: z.string().optional(),
  icon: z.string().optional(),
})

/**
 * GET /api/roles
 * Get all roles in the organization
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
        { success: false, error: 'Insufficient permissions to view roles' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const roles = await RoleService.getAllRoles(session.user.orgId, includeInactive)

    return NextResponse.json({
      success: true,
      data: roles,
    })
  } catch (error) {
    console.error('Get roles error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/roles
 * Create a custom role (admin only)
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

    // Check permission
    if (!(await requirePermission(session, 'roles.create'))) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createRoleSchema.parse(body)

    const role = await RoleService.createRole(
      session.user.orgId,
      session.user.id,
      validatedData
    )

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role created successfully',
    })
  } catch (error) {
    console.error('Create role error:', error)

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
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
