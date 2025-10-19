import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { IncidentAnalyticsService } from '@/lib/services/analytics/incident-analytics'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/incidents
 * Get incident analytics and metrics
 *
 * Query Parameters:
 * - startDate (optional): ISO date string for range start
 * - endDate (optional): ISO date string for range end
 * - granularity (optional): 'day' | 'week' | 'month' (default: 'day')
 * - type (optional): 'overview' | 'severity' | 'root-cause' | 'service-impact' | 'mttr' (default: 'overview')
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
      'incidents.view',
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
        data = await IncidentAnalyticsService.getOverviewMetrics(
          orgId,
          startDate,
          endDate
        )
        break

      case 'severity':
        if (!startDate || !endDate) {
          endDate = new Date()
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
        data = await IncidentAnalyticsService.getSeverityTimeline(
          orgId,
          startDate,
          endDate,
          granularity
        )
        break

      case 'root-cause':
        data = await IncidentAnalyticsService.getRootCauseDistribution(
          orgId,
          startDate,
          endDate
        )
        break

      case 'service-impact':
        data = await IncidentAnalyticsService.getServiceImpactAnalysis(
          orgId,
          startDate,
          endDate
        )
        break

      case 'status':
        data = await IncidentAnalyticsService.getStatusDistribution(
          orgId,
          startDate,
          endDate
        )
        break

      case 'mttr':
        data = await IncidentAnalyticsService.getMTTRBySeverity(
          orgId,
          startDate,
          endDate
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
    console.error('Error fetching incident analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch incident analytics',
      },
      { status: 500 }
    )
  }
}
