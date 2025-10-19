import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * GET /api/time-tracking/stats
 * Get time tracking statistics with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined

    const stats = await TimeTrackingService.getTimeTrackingStats(
      session.user.orgId,
      {
        userId,
        startDate,
        endDate,
      }
    )

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching time tracking stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
