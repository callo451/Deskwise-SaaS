import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectAnalyticsService } from '@/lib/services/project-analytics'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/portfolios/[id]
 * Get portfolio-level analytics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (
      !(await requirePermission(session, 'portfolios.view.all')) &&
      !(await requirePermission(session, 'reports.view'))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: portfolioId } = await context.params

    const analytics = await ProjectAnalyticsService.getPortfolioAnalytics(
      portfolioId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('Error fetching portfolio analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
