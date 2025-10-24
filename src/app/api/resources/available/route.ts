import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ResourceManagementService } from '@/lib/services/resource-management'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/resources/available
 * Get available resources for a time period
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minHours = searchParams.get('minHours')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const availableResources = await ResourceManagementService.getAvailableResources(
      session.user.orgId,
      new Date(startDate),
      new Date(endDate),
      minHours ? parseInt(minHours) : 10
    )

    return NextResponse.json({
      success: true,
      data: availableResources
    })
  } catch (error) {
    console.error('Error fetching available resources:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch available resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
