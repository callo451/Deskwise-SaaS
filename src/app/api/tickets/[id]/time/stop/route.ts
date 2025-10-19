import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * POST /api/tickets/[id]/time/stop
 * Stop a running timer
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entryId } = body

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    const entry = await TimeTrackingService.stopTimer(
      entryId,
      session.user.orgId
    )

    if (!entry) {
      return NextResponse.json(
        { error: 'Time entry not found or already stopped' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: entry })
  } catch (error: any) {
    console.error('Error stopping timer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stop timer' },
      { status: 500 }
    )
  }
}
