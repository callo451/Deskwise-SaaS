import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TimeTrackingService } from '@/lib/services/time-tracking'

/**
 * GET /api/time-tracking/entries
 * Get time entries with filters (for reports)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId') || undefined
    const ticketId = searchParams.get('ticketId') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const isBillable = searchParams.get('isBillable')
      ? searchParams.get('isBillable') === 'true'
      : undefined

    const entries = await TimeTrackingService.getTimeEntriesWithFilters(
      session.user.orgId,
      {
        userId,
        ticketId,
        startDate,
        endDate,
        isBillable,
      }
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
