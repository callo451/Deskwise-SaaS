import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectAnalyticsService } from '@/lib/services/analytics/project-analytics'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/projects
 * Get project analytics and metrics
 *
 * Query Parameters:
 * - startDate (optional): ISO date string for range start
 * - endDate (optional): ISO date string for range end
 * - granularity (optional): 'day' | 'week' | 'month' (default: 'month')
 * - type (optional): 'overview' | 'status' | 'budget' | 'timeline' | 'resources' | 'completion' | 'milestones' (default: 'overview')
 * - limit (optional): Number of results for budget/timeline analysis (default: 20)
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
      'projects.view',
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
    const granularity = (searchParams.get('granularity') || 'month') as 'day' | 'week' | 'month'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    let data: any

    switch (type) {
      case 'overview':
        data = await ProjectAnalyticsService.getOverviewMetrics(
          orgId,
          startDate,
          endDate
        )
        break

      case 'status':
        data = await ProjectAnalyticsService.getStatusDistribution(
          orgId,
          startDate,
          endDate
        )
        break

      case 'budget':
        data = await ProjectAnalyticsService.getBudgetAnalysis(
          orgId,
          startDate,
          endDate,
          limit
        )
        break

      case 'timeline':
        data = await ProjectAnalyticsService.getTimelinePerformance(
          orgId,
          startDate,
          endDate,
          limit
        )
        break

      case 'resources':
        data = await ProjectAnalyticsService.getResourceAllocation(
          orgId,
          startDate,
          endDate
        )
        break

      case 'completion':
        if (!startDate || !endDate) {
          endDate = new Date()
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
        data = await ProjectAnalyticsService.getCompletionRateTrend(
          orgId,
          startDate,
          endDate,
          granularity
        )
        break

      case 'milestones':
        data = await ProjectAnalyticsService.getMilestoneCompletionRate(
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
    console.error('Error fetching project analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project analytics',
      },
      { status: 500 }
    )
  }
}
