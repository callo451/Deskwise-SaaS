import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * GET /api/tickets/[id]/time
 * Get time entries for a ticket
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: ticketId } = await context.params

    const entries = await TimeTrackingService.getTimeEntries(
      ticketId,
      session.user.orgId
    )

    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tickets/[id]/time
 * Log time manually (without timer)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId || !session.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: ticketId } = await context.params
    const body = await request.json()

    const { description, duration, isBillable, startTime } = body

    if (!description || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'Invalid input. Description and duration are required.' },
        { status: 400 }
      )
    }

    const userName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email || 'Unknown'

    const entry = await TimeTrackingService.logTime(session.user.orgId, {
      ticketId,
      userId: session.user.userId,
      userName,
      description,
      duration,
      isBillable: isBillable ?? false,
      startTime: startTime ? new Date(startTime) : undefined,
    })

    return NextResponse.json({ success: true, data: entry })
  } catch (error: any) {
    console.error('Error logging time:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to log time' },
      { status: 500 }
    )
  }
}
