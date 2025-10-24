import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { UnifiedTimeTrackingService } from '@/lib/services/unified-time-tracking'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const startTimerSchema = z.object({
  type: z.enum(['ticket', 'project']),
  ticketId: z.string().optional(),
  projectId: z.string().optional(),
  projectTaskId: z.string().optional(),
  description: z.string().optional(),
})

const stopTimerSchema = z.object({
  description: z.string().min(1),
  isBillable: z.boolean(),
  tags: z.array(z.string()).optional(),
})

/**
 * GET /api/time/timer
 * Get active timer for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tracker = await UnifiedTimeTrackingService.getActiveTimer(
      session.user.orgId,
      session.user.userId
    )

    if (!tracker) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    // Calculate elapsed time
    const elapsedMs = Date.now() - tracker.startTime.getTime()
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))

    return NextResponse.json({
      success: true,
      data: {
        ...tracker,
        elapsedMinutes,
      },
    })
  } catch (error) {
    console.error('Error getting active timer:', error)
    return NextResponse.json(
      {
        error: 'Failed to get active timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/time/timer
 * Start a new timer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = startTimerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check permissions based on type
    if (data.type === 'ticket') {
      if (!(await requirePermission(session, 'tickets.time.log'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (data.type === 'project') {
      if (!(await requirePermission(session, 'projects.time.log'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Start timer
    const tracker = await UnifiedTimeTrackingService.startTimer(
      session.user.orgId,
      session.user.userId,
      data
    )

    return NextResponse.json({
      success: true,
      message: 'Timer started',
      data: tracker,
    })
  } catch (error) {
    console.error('Error starting timer:', error)
    return NextResponse.json(
      {
        error: 'Failed to start timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/time/timer
 * Stop active timer and create time entry
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = stopTimerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Stop timer
    const timeEntry = await UnifiedTimeTrackingService.stopTimer(
      session.user.orgId,
      session.user.userId,
      session.user.name || 'Unknown',
      data
    )

    return NextResponse.json({
      success: true,
      message: 'Timer stopped and time logged',
      data: timeEntry,
    })
  } catch (error) {
    console.error('Error stopping timer:', error)
    return NextResponse.json(
      {
        error: 'Failed to stop timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/time/timer
 * Cancel active timer without creating entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await UnifiedTimeTrackingService.cancelTimer(
      session.user.orgId,
      session.user.userId
    )

    return NextResponse.json({
      success: true,
      message: 'Timer cancelled',
    })
  } catch (error) {
    console.error('Error cancelling timer:', error)
    return NextResponse.json(
      {
        error: 'Failed to cancel timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
