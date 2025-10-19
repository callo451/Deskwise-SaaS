import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { CannedResponseService } from '@/lib/services/canned-responses'

/**
 * GET /api/canned-responses/[id]
 * Get a specific canned response by ID
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

    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.assigned',
      'tickets.view.own',
      'tickets.create',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { id } = await params

    const cannedResponse = await CannedResponseService.getCannedResponseById(
      id,
      session.user.orgId
    )

    if (!cannedResponse) {
      return NextResponse.json(
        { success: false, error: 'Canned response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cannedResponse,
    })
  } catch (error) {
    console.error('Get canned response error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch canned response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/canned-responses/[id]
 * Update a canned response
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

    const hasPermission = await requireAnyPermission(session, [
      'tickets.manage',
      'settings.edit',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.manage') },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, content, category, tags, isActive } = body

    // Validation
    if (name && name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name must be 100 characters or less' },
        { status: 400 }
      )
    }

    if (content && content.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Content must be 5000 characters or less' },
        { status: 400 }
      )
    }

    // Check if canned response exists
    const existing = await CannedResponseService.getCannedResponseById(
      id,
      session.user.orgId
    )

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Canned response not found' },
        { status: 404 }
      )
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (content !== undefined) updates.content = content.trim()
    if (category !== undefined) updates.category = category.trim()
    if (tags !== undefined) updates.tags = tags
    if (isActive !== undefined) updates.isActive = isActive

    const updated = await CannedResponseService.updateCannedResponse(
      id,
      session.user.orgId,
      updates
    )

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Canned response updated successfully',
    })
  } catch (error) {
    console.error('Update canned response error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update canned response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/canned-responses/[id]
 * Delete a canned response
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

    const hasPermission = await requireAnyPermission(session, [
      'tickets.manage',
      'settings.edit',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.manage') },
        { status: 403 }
      )
    }

    const { id } = await params

    const deleted = await CannedResponseService.deleteCannedResponse(
      id,
      session.user.orgId
    )

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Canned response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Canned response deleted successfully',
    })
  } catch (error) {
    console.error('Delete canned response error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete canned response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
