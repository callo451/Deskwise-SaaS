import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/projects/[id]/tickets
 * Get all tickets linked to a project
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
    const { searchParams } = new URL(request.url)

    const filters = {
      taskId: searchParams.get('taskId') || undefined,
      status: searchParams.get('status') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      priority: searchParams.get('priority') || undefined,
    }

    const tickets = await ProjectTicketIntegrationService.getProjectTickets(
      projectId,
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: tickets,
    })
  } catch (error) {
    console.error('Error fetching project tickets:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch project tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
