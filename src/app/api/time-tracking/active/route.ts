import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * GET /api/time-tracking/active
 * Get user's active timers across all tickets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId || !session.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const timers = await TimeTrackingService.getActiveTimers(
      session.user.userId,
      session.user.orgId
    )

    return NextResponse.json({ success: true, data: timers })
  } catch (error) {
    console.error('Error fetching active timers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active timers' },
      { status: 500 }
    )
  }
}
