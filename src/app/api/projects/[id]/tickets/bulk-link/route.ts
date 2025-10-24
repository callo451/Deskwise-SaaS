import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const bulkLinkSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
  taskId: z.string().optional(),
})

/**
 * POST /api/projects/[id]/tickets/bulk-link
 * Bulk link multiple tickets to a project
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await requirePermission(session, 'projects.edit.all')) &&
        !(await requirePermission(session, 'projects.edit.own'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId } = await context.params
    const body = await request.json()

    // Validate input
    const validation = bulkLinkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { ticketIds, taskId } = validation.data

    // Bulk link tickets
    const results = await ProjectTicketIntegrationService.bulkLinkTickets(
      ticketIds,
      projectId,
      session.user.orgId,
      session.user.id,
      taskId
    )

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${results.success} tickets. ${results.failed} failed.`,
      data: results,
    })
  } catch (error) {
    console.error('Error bulk linking tickets:', error)
    return NextResponse.json(
      {
        error: 'Failed to bulk link tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
