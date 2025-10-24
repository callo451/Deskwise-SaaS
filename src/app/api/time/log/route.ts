import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { UnifiedTimeTrackingService } from '@/lib/services/unified-time-tracking'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const logTimeSchema = z.object({
  type: z.enum(['ticket', 'project']),
  ticketId: z.string().optional(),
  projectId: z.string().optional(),
  projectTaskId: z.string().optional(),
  description: z.string().min(1),
  hours: z.number().min(0).max(24),
  minutes: z.number().min(0).max(59),
  isBillable: z.boolean(),
  tags: z.array(z.string()).optional(),
})

/**
 * POST /api/time/log
 * Log manual time entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = logTimeSchema.safeParse(body)
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

    // Log time
    const timeEntry = await UnifiedTimeTrackingService.logTime(
      session.user.orgId,
      session.user.userId,
      session.user.name || 'Unknown',
      data
    )

    return NextResponse.json({
      success: true,
      message: 'Time logged successfully',
      data: timeEntry,
    })
  } catch (error) {
    console.error('Error logging time:', error)
    return NextResponse.json(
      {
        error: 'Failed to log time',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
