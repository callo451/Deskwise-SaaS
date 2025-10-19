import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OverviewAnalyticsService } from '@/lib/services/analytics/overview-analytics'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/overview
 * Get overview dashboard analytics
 *
 * Query Parameters:
 * - startDate (optional): ISO date string for range start
 * - endDate (optional): ISO date string for range end
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - analytics viewing requires reports.view permission
    const hasPermission = await requireAnyPermission(session, [
      'reports.view',
      'reports.create',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('reports.view') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgId = session.user.orgId

    // Parse date parameters
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (searchParams.get('startDate')) {
      startDate = new Date(searchParams.get('startDate')!)
    }

    if (searchParams.get('endDate')) {
      endDate = new Date(searchParams.get('endDate')!)
    }

    // Get overview dashboard data
    const dashboardData = await OverviewAnalyticsService.getOverviewDashboard(
      orgId,
      startDate,
      endDate
    )

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error('Error fetching overview analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch overview analytics',
      },
      { status: 500 }
    )
  }
}
