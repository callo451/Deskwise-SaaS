import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SLAAnalyticsService } from '@/lib/services/analytics/sla-analytics'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/sla
 * Get SLA performance analytics and metrics
 *
 * Query Parameters:
 * - startDate (optional): ISO date string for range start
 * - endDate (optional): ISO date string for range end
 * - granularity (optional): 'day' | 'week' | 'month' (default: 'day')
 * - type (optional): 'overview' | 'category' | 'priority' | 'trend' | 'breach-time' | 'team' (default: 'overview')
 * - limit (optional): Number of results for category/team analysis (default: 10)
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

    // Check RBAC permissions
    const hasPermission = await requireAnyPermission(session, [
      'reports.view',
      'tickets.view.all',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('reports.view') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgId = session.user.orgId

    // Parse parameters
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (searchParams.get('startDate')) {
      startDate = new Date(searchParams.get('startDate')!)
    }

    if (searchParams.get('endDate')) {
      endDate = new Date(searchParams.get('endDate')!)
    }

    const type = searchParams.get('type') || 'overview'
    const granularity = (searchParams.get('granularity') || 'day') as 'day' | 'week' | 'month'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    let data: any

    switch (type) {
      case 'overview':
        data = await SLAAnalyticsService.getOverviewMetrics(
          orgId,
          startDate,
          endDate
        )
        break

      case 'category':
        data = await SLAAnalyticsService.getBreachByCategory(
          orgId,
          startDate,
          endDate,
          limit
        )
        break

      case 'priority':
        data = await SLAAnalyticsService.getBreachByPriority(
          orgId,
          startDate,
          endDate
        )
        break

      case 'trend':
        if (!startDate || !endDate) {
          endDate = new Date()
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
        data = await SLAAnalyticsService.getComplianceTrend(
          orgId,
          startDate,
          endDate,
          granularity
        )
        break

      case 'breach-time':
        data = await SLAAnalyticsService.getTimeToBreachAnalysis(
          orgId,
          startDate,
          endDate
        )
        break

      case 'team':
        data = await SLAAnalyticsService.getPerformanceByTeam(
          orgId,
          startDate,
          endDate,
          limit
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching SLA analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SLA analytics',
      },
      { status: 500 }
    )
  }
}
