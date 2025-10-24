import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ResourceManagementService } from '@/lib/services/resource-management'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/resources/team-workload
 * Get team workload overview
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await requirePermission(session, 'projects.view.all'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')

    const weekStartDate = weekStart ? new Date(weekStart) : new Date()

    const workload = await ResourceManagementService.getTeamWorkload(
      session.user.orgId,
      weekStartDate
    )

    return NextResponse.json({
      success: true,
      data: workload
    })
  } catch (error) {
    console.error('Error fetching team workload:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch team workload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
