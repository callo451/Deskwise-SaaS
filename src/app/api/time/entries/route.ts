import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { UnifiedTimeTrackingService } from '@/lib/services/unified-time-tracking'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/time/entries
 * Get time entries with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const filters: any = {}

    if (searchParams.get('type')) {
      filters.type = searchParams.get('type')
    }
    if (searchParams.get('ticketId')) {
      filters.ticketId = searchParams.get('ticketId')
    }
    if (searchParams.get('projectId')) {
      filters.projectId = searchParams.get('projectId')
    }
    if (searchParams.get('projectTaskId')) {
      filters.projectTaskId = searchParams.get('projectTaskId')
    }
    if (searchParams.get('userId')) {
      // Only admins can view other users' time
      if (searchParams.get('userId') !== session.user.userId) {
        if (!(await requirePermission(session, 'reports.view'))) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      filters.userId = searchParams.get('userId')
    } else {
      // Default to current user's time
      filters.userId = session.user.userId
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    if (searchParams.get('isBillable')) {
      filters.isBillable = searchParams.get('isBillable') === 'true'
    }
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!)
    }

    const entries = await UnifiedTimeTrackingService.getTimeEntries(
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: entries,
    })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch time entries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
