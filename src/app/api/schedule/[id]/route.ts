import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchedulingService } from '@/lib/services/scheduling'
import { z } from 'zod'

const updateScheduleSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['onsite', 'remote', 'meeting', 'maintenance']).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  ticketId: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

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
    const item = await SchedulingService.getScheduleItemById(id, session.user.orgId)

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
    })
  } catch (error) {
    console.error('Get schedule item error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

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

    const { id } = await params
    const body = await request.json()
    const validatedData = updateScheduleSchema.parse(body)

    // Convert date strings to Date objects if provided
    const updates: any = { ...validatedData }
    if (updates.startTime) {
      updates.startTime = new Date(updates.startTime)
    }
    if (updates.endTime) {
      updates.endTime = new Date(updates.endTime)
    }

    // Check for conflicts if time is being updated
    if (updates.assignedTo || updates.startTime || updates.endTime) {
      const currentItem = await SchedulingService.getScheduleItemById(id, session.user.orgId)
      if (currentItem) {
        const assignedTo = updates.assignedTo || currentItem.assignedTo
        const startTime = updates.startTime || currentItem.startTime
        const endTime = updates.endTime || currentItem.endTime

        const conflicts = await SchedulingService.checkConflicts(
          session.user.orgId,
          assignedTo,
          startTime,
          endTime,
          id
        )

        if (conflicts.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Scheduling conflict detected',
              conflicts: conflicts.map(c => ({
                id: c._id,
                title: c.title,
                startTime: c.startTime,
                endTime: c.endTime,
              })),
            },
            { status: 409 }
          )
        }
      }
    }

    const item = await SchedulingService.updateScheduleItem(
      id,
      session.user.orgId,
      updates
    )

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Appointment updated successfully',
    })
  } catch (error) {
    console.error('Update schedule item error:', error)

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

    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

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

    const { id } = await params
    const success = await SchedulingService.deleteScheduleItem(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    })
  } catch (error) {
    console.error('Delete schedule item error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}
