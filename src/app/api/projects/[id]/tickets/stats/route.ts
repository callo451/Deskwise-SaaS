import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/projects/[id]/tickets/stats
 * Get ticket statistics for a project
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
    if (!(await requirePermission(session, 'projects.view.all')) &&
        !(await requirePermission(session, 'projects.view.own')) &&
        !(await requirePermission(session, 'projects.view.assigned'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId } = await context.params

    const stats = await ProjectTicketIntegrationService.getProjectTicketStats(
      projectId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching project ticket stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch project ticket stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
