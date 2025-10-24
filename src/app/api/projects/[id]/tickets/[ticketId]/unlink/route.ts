import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * DELETE /api/projects/[id]/tickets/[ticketId]/unlink
 * Unlink a ticket from a project
 */
export async function DELETE(
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

    const { ticketId } = await context.params

    // Unlink ticket from project
    const updatedTicket = await ProjectTicketIntegrationService.unlinkTicketFromProject(
      ticketId,
      session.user.orgId,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Ticket unlinked from project successfully',
      data: updatedTicket,
    })
  } catch (error) {
    console.error('Error unlinking ticket from project:', error)
    return NextResponse.json(
      {
        error: 'Failed to unlink ticket from project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
