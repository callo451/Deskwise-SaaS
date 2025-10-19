import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'

/**
 * POST /api/unified-tickets/[id]/reject - Reject a change or service request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Only changes and service requests can be rejected
    if (!['change', 'service_request'].includes(ticket.ticketType)) {
      return NextResponse.json(
        { error: 'Only changes and service requests can be rejected' },
        { status: 400 }
      )
    }

    // Check approval permission (same permission for approve/reject)
    const approvePermission =
      ticket.ticketType === 'change' ? 'changes.approve' : 'service_requests.approve'

    const hasPermission = await requirePermission(session, approvePermission)

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(approvePermission) },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { reason } = body

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rejection reason must be at least 10 characters' },
        { status: 400 }
      )
    }

    const updatedTicket = await UnifiedTicketService.reject(
      id,
      session.user.orgId,
      reason,
      session.user.userId
    )

    // Trigger rejection notification
    try {
      const event =
        ticket.ticketType === 'change'
          ? NotificationEvent.CHANGE_REJECTED
          : NotificationEvent.SERVICE_REQUEST_REJECTED

      await NotificationEngine.triggerNotification(session.user.orgId, event, {
        ticket: updatedTicket,
        rejectedBy: session.user.name,
        reason,
        relatedEntity: {
          type: ticket.ticketType,
          id: id,
        },
      })
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
    }

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `${ticket.ticketType === 'change' ? 'Change' : 'Service request'} rejected successfully`,
    })
  } catch (error: any) {
    console.error('Error rejecting ticket:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
