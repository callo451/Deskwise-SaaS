import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * POST /api/projects/[id]/tickets/[ticketId]/sync-time
 * Sync ticket time entries to project task
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

    // Check permission
    if (!(await requirePermission(session, 'projects.time.log')) &&
        !(await requirePermission(session, 'projects.edit.all')) &&
        !(await requirePermission(session, 'projects.edit.own'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ticketId } = await context.params

    // Sync time
    const result = await ProjectTicketIntegrationService.syncTicketTimeToTask(
      ticketId,
      session.user.orgId
    )

    if (!result.synced) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ticket is not linked to a project task',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Time entries synced successfully',
      data: {
        totalMinutes: result.totalMinutes,
        totalHours: Math.round((result.totalMinutes / 60) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error syncing ticket time:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync ticket time',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
