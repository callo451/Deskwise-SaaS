import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { UnifiedTimeTrackingService } from '@/lib/services/unified-time-tracking'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const updateTimeEntrySchema = z.object({
  description: z.string().optional(),
  hours: z.number().min(0).max(24).optional(),
  minutes: z.number().min(0).max(59).optional(),
  isBillable: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * PUT /api/time/entries/[id]
 * Update a time entry
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

    const { id } = await context.params
    const body = await request.json()

    // Validate input
    const validation = updateTimeEntrySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Update time entry
    const timeEntry = await UnifiedTimeTrackingService.updateTimeEntry(
      id,
      session.user.orgId,
      session.user.userId,
      updates
    )

    return NextResponse.json({
      success: true,
      message: 'Time entry updated successfully',
      data: timeEntry,
    })
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      {
        error: 'Failed to update time entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/time/entries/[id]
 * Delete a time entry
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

    const { id } = await context.params

    // Delete time entry
    await UnifiedTimeTrackingService.deleteTimeEntry(
      id,
      session.user.orgId,
      session.user.userId
    )

    return NextResponse.json({
      success: true,
      message: 'Time entry deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete time entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
