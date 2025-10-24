import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketTimeService } from '@/lib/services/unified-ticket-time'
import {
  requireAnyPermission,
  createMultiplePermissionError,
} from '@/lib/middleware/permissions'

/**
 * GET /api/unified-tickets/[id]/time/active - Get active timer for current user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check view permission
    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.view.all', 'tickets.view.own'], false) },
        { status: 403 }
      )
    }

    const timer = await UnifiedTicketTimeService.getActiveTimer(
      id,
      session.user.userId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      timer,
    })
  } catch (error: any) {
    console.error('Error fetching active timer:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
