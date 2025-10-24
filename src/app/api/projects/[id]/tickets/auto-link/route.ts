import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectTicketIntegrationService } from '@/lib/services/project-ticket-integration'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const autoLinkSchema = z.object({
  keywords: z.array(z.string()).min(1),
  dryRun: z.boolean().optional().default(false),
})

/**
 * POST /api/projects/[id]/tickets/auto-link
 * Auto-link tickets based on keyword matching
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

    // Check permission - requires projects.manage
    if (!(await requirePermission(session, 'projects.manage'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: projectId } = await context.params
    const body = await request.json()

    // Validate input
    const validation = autoLinkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { keywords, dryRun } = validation.data

    // Auto-link tickets
    const results = await ProjectTicketIntegrationService.autoLinkTicketsByKeywords(
      projectId,
      session.user.orgId,
      keywords,
      session.user.id,
      dryRun
    )

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Found ${results.matchedTickets.length} tickets matching keywords (dry run)`
        : `Successfully linked ${results.linkedCount} tickets`,
      data: results,
    })
  } catch (error) {
    console.error('Error auto-linking tickets:', error)
    return NextResponse.json(
      {
        error: 'Failed to auto-link tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
