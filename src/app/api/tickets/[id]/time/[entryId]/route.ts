import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * PUT /api/tickets/[id]/time/[entryId]
 * Update a time entry
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId } = await context.params
    const body = await request.json()

    const { description, duration, isBillable } = body

    const entry = await TimeTrackingService.updateTimeEntry(
      entryId,
      session.user.orgId,
      {
        description,
        duration,
        isBillable,
      }
    )

    if (!entry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: entry })
  } catch (error: any) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update time entry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tickets/[id]/time/[entryId]
 * Delete a time entry
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId } = await context.params

    const success = await TimeTrackingService.deleteTimeEntry(
      entryId,
      session.user.orgId
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete time entry' },
      { status: 500 }
    )
  }
}
