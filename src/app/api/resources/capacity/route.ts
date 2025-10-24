import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ResourceManagementService } from '@/lib/services/resource-management'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/resources/capacity
 * Get resource capacity for a user
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
    const userId = searchParams.get('userId')
    const weekStart = searchParams.get('weekStart')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const weekStartDate = weekStart ? new Date(weekStart) : new Date()

    const capacity = await ResourceManagementService.getResourceCapacity(
      userId,
      session.user.orgId,
      weekStartDate
    )

    return NextResponse.json({
      success: true,
      data: capacity
    })
  } catch (error) {
    console.error('Error fetching resource capacity:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch resource capacity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
