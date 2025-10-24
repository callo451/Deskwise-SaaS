import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'

/**
 * POST /api/unified-tickets/[id]/approve - Approve a change or service request
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

    // Only changes and service requests can be approved
    if (!['change', 'service_request'].includes(ticket.ticketType)) {
      return NextResponse.json(
        { error: 'Only changes and service requests can be approved' },
        { status: 400 }
      )
    }

    // Check approval permission (unified ticketing permissions)
    const approvePermission =
      ticket.ticketType === 'change' ? 'tickets.approveChange' : 'tickets.approveServiceRequest'

    const hasPermission = await requirePermission(session, approvePermission)

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(approvePermission) },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { notes } = body

    const updatedTicket = await UnifiedTicketService.approve(
      id,
      session.user.orgId,
      session.user.userId,
      session.user.name,
      notes
    )

    // Trigger approval notification
    try {
      const event =
        ticket.ticketType === 'change'
          ? NotificationEvent.CHANGE_APPROVED
          : NotificationEvent.SERVICE_REQUEST_APPROVED

      await NotificationEngine.triggerNotification(session.user.orgId, event, {
        ticket: updatedTicket,
        approvedBy: session.user.name,
        notes,
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
      message: `${ticket.ticketType === 'change' ? 'Change' : 'Service request'} approved successfully`,
    })
  } catch (error: any) {
    console.error('Error approving ticket:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
