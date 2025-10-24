import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ResourceManagementService } from '@/lib/services/resource-management'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * PUT /api/resources/allocations/[id]
 * Update a resource allocation
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await requirePermission(session, 'projects.manage'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()

    // If dates or hours are changing, check for conflicts
    if (body.startDate || body.endDate || body.allocatedHours) {
      const conflicts = await ResourceManagementService.checkAllocationConflicts(
        body.userId,
        session.user.orgId,
        body.startDate ? new Date(body.startDate) : new Date(),
        body.endDate ? new Date(body.endDate) : new Date(),
        body.allocatedHours || 0,
        id // Exclude current allocation from conflict check
      )

      if (conflicts.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Update would cause over-allocation',
          conflicts
        }, { status: 409 })
      }
    }

    const updates: any = { ...body }
    if (updates.startDate) updates.startDate = new Date(updates.startDate)
    if (updates.endDate) updates.endDate = new Date(updates.endDate)

    const allocation = await ResourceManagementService.updateAllocation(
      id,
      session.user.orgId,
      updates
    )

    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: allocation
    })
  } catch (error) {
    console.error('Error updating resource allocation:', error)
    return NextResponse.json(
      {
        error: 'Failed to update resource allocation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resources/allocations/[id]
 * Delete a resource allocation
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await requirePermission(session, 'projects.manage'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const deleted = await ResourceManagementService.deleteAllocation(
      id,
      session.user.orgId
    )

    if (!deleted) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Allocation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting resource allocation:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete resource allocation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
