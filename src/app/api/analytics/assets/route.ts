import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetAnalyticsService } from '@/lib/services/analytics/asset-analytics'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/assets
 * Get asset analytics and metrics
 *
 * Query Parameters:
 * - startDate (optional): ISO date string for range start
 * - endDate (optional): ISO date string for range end
 * - type (optional): 'overview' | 'lifecycle' | 'categories' | 'tco' | 'warranty' | 'age' (default: 'overview')
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
      'assets.view',
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

    let data: any

    switch (type) {
      case 'overview':
        data = await AssetAnalyticsService.getOverviewMetrics(
          orgId,
          startDate,
          endDate
        )
        break

      case 'lifecycle':
        data = await AssetAnalyticsService.getLifecycleDistribution(orgId)
        break

      case 'categories':
        data = await AssetAnalyticsService.getCategoryBreakdown(orgId)
        break

      case 'tco':
        data = await AssetAnalyticsService.getTCOAnalysis(
          orgId,
          startDate,
          endDate
        )
        break

      case 'warranty':
        data = await AssetAnalyticsService.getWarrantyExpirationTracker(orgId)
        break

      case 'age':
        data = await AssetAnalyticsService.getAssetAgeDistribution(orgId)
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
    console.error('Error fetching asset analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch asset analytics',
      },
      { status: 500 }
    )
  }
}
