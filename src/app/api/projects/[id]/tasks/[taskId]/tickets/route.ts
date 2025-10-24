import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/projects/[id]/tasks/[taskId]/tickets
 * Get all tickets linked to a specific project task
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; taskId: string }> }
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

    const { id: projectId, taskId } = await context.params

    const tickets = await ProjectTicketIntegrationService.getTaskTickets(
      taskId,
      projectId,
      session.user.orgId
    )

    const stats = await ProjectTicketIntegrationService.getTaskTicketStats(
      taskId,
      projectId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        stats,
      },
    })
  } catch (error) {
    console.error('Error fetching task tickets:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch task tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
