import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectAnalyticsService } from '@/lib/services/project-analytics'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/projects/[id]/time
 * Get time tracking analytics
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
      !(await requirePermission(session, 'projects.analytics.view')) &&
      !(await requirePermission(session, 'projects.view.all'))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId } = await context.params

    const analytics = await ProjectAnalyticsService.getProjectTimeAnalytics(
      projectId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('Error fetching time analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch time analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
