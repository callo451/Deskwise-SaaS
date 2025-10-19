import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchedulingService } from '@/lib/services/scheduling'
import { z } from 'zod'

const createScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['onsite', 'remote', 'meeting', 'maintenance']),
  assignedTo: z.string().min(1, 'Assigned technician is required'),
  clientId: z.string().optional(),
  ticketId: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number(),
    endDate: z.string().optional(),
    daysOfWeek: z.array(z.number()).optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      assignedTo: searchParams.get('assignedTo') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
    }

    const items = await SchedulingService.getScheduleItems(
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error('Get schedule error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    // Check for conflicts
    const conflicts = await SchedulingService.checkConflicts(
      session.user.orgId,
      validatedData.assignedTo,
      new Date(validatedData.startTime),
      new Date(validatedData.endTime)
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

    const item = await SchedulingService.createScheduleItem(
      session.user.orgId,
      {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        recurrencePattern: validatedData.recurrencePattern ? {
          ...validatedData.recurrencePattern,
          endDate: validatedData.recurrencePattern.endDate
            ? new Date(validatedData.recurrencePattern.endDate)
            : undefined,
        } : undefined,
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Appointment created successfully',
    })
  } catch (error) {
    console.error('Create schedule error:', error)

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
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
