import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectAnalyticsService } from '@/lib/services/project-analytics'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/analytics/projects/[id]/trends
 * Get task completion trends
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
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const trends = await ProjectAnalyticsService.getTaskCompletionTrends(
      projectId,
      session.user.orgId,
      days
    )

    return NextResponse.json({
      success: true,
      data: trends,
    })
  } catch (error) {
    console.error('Error fetching task trends:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch task trends',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
