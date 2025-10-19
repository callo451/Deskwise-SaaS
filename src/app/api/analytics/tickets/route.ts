import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next/server'
import { authOptions } from '@/lib/auth'
import { TicketAnalyticsService } from '@/lib/services/analytics/ticket-analytics'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/tickets
 * Get ticket analytics and metrics
 *
 * Query Parameters:
 * - startDate (optional): ISO date string for range start
 * - endDate (optional): ISO date string for range end
 * - granularity (optional): 'day' | 'week' | 'month' (default: 'day')
 * - type (optional): 'overview' | 'distribution' | 'trends' | 'categories' | 'sla' (default: 'overview')
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
      'tickets.view.assigned',
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

    let data: any

    switch (type) {
      case 'overview':
        data = await TicketAnalyticsService.getOverviewMetrics(orgId, startDate, endDate)
        break

      case 'distribution':
        data = await TicketAnalyticsService.getDistribution(orgId, startDate, endDate)
        break

      case 'trends':
        if (!startDate || !endDate) {
          // Default to last 30 days
          endDate = new Date()
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
        data = await TicketAnalyticsService.getVolumeTrends(
          orgId,
          startDate,
          endDate,
          granularity
        )
        break

      case 'categories':
        data = await TicketAnalyticsService.getCategoryPerformance(
          orgId,
          startDate,
          endDate
        )
        break

      case 'sla':
        if (!startDate || !endDate) {
          endDate = new Date()
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
        data = await TicketAnalyticsService.getSLAComplianceTrend(
          orgId,
          startDate,
          endDate,
          granularity
        )
        break

      case 'resolution-time':
        if (!startDate || !endDate) {
          endDate = new Date()
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
        data = await TicketAnalyticsService.getResolutionTimeTrend(
          orgId,
          startDate,
          endDate,
          granularity
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
    console.error('Error fetching ticket analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ticket analytics',
      },
      { status: 500 }
    )
  }
}
