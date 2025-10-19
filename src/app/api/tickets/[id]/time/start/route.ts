import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * POST /api/tickets/[id]/time/start
 * Start a timer for a ticket
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

    const { description, isBillable } = body

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const userName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email || 'Unknown'

    const entry = await TimeTrackingService.startTimer(session.user.orgId, {
      ticketId,
      userId: session.user.userId,
      userName,
      description,
      isBillable: isBillable ?? false,
    })

    return NextResponse.json({ success: true, data: entry })
  } catch (error: any) {
    console.error('Error starting timer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start timer' },
      { status: 500 }
    )
  }
}
