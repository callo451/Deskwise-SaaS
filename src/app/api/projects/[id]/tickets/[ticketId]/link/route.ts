import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const linkSchema = z.object({
  taskId: z.string().optional(),
})

/**
 * POST /api/projects/[id]/tickets/[ticketId]/link
 * Link a ticket to a project (and optionally a task)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - requires projects.edit or tickets.edit
    if (!(await requirePermission(session, 'projects.edit.all')) &&
        !(await requirePermission(session, 'projects.edit.own')) &&
        !(await requirePermission(session, 'tickets.edit.all')) &&
        !(await requirePermission(session, 'tickets.edit.own'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId, ticketId } = await context.params
    const body = await request.json()

    // Validate input
    const validation = linkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { taskId } = validation.data

    // Link ticket to project
    const updatedTicket = await ProjectTicketIntegrationService.linkTicketToProject(
      ticketId,
      projectId,
      session.user.orgId,
      taskId
    )

    // If task specified, sync time entries
    if (taskId) {
      await ProjectTicketIntegrationService.syncTicketTimeToTask(
        ticketId,
        session.user.orgId
      )
    }

    return NextResponse.json({
      success: true,
      message: taskId
        ? 'Ticket linked to project and task successfully'
        : 'Ticket linked to project successfully',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Error linking ticket to project:', error)
    return NextResponse.json(
      {
        error: 'Failed to link ticket to project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
