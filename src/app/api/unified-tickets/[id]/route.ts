import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'

/**
 * GET /api/unified-tickets/[id] - Get a single unified ticket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check type-specific view permission
    const typePermissions: Record<string, string> = {
      ticket: 'tickets.view',
      incident: 'incidents.view',
      service_request: 'service_requests.view',
      change: 'changes.view',
      problem: 'problems.view',
    }

    const permission = typePermissions[ticket.ticketType] || 'tickets.view'
    const hasPermission = await requirePermission(session, permission)

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(permission) },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error: any) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/unified-tickets/[id] - Update a unified ticket
 */
export async function PUT(
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

    // Check type-specific edit permission
    const typePermissions: Record<string, string> = {
      ticket: 'tickets.edit',
      incident: 'incidents.edit',
      service_request: 'service_requests.edit',
      change: 'changes.edit',
      problem: 'problems.edit',
    }

    const permission = typePermissions[ticket.ticketType] || 'tickets.edit'
    const hasPermission = await requirePermission(session, permission)

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(permission) },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Handle status updates separately for workflow validation
    if (body.status && body.status !== ticket.status) {
      const updatedTicket = await UnifiedTicketService.updateStatus(
        id,
        session.user.orgId,
        body.status,
        session.user.userId
      )

      // Trigger status change notification
      try {
        await NotificationEngine.triggerNotification(
          session.user.orgId,
          NotificationEvent.TICKET_STATUS_CHANGED,
          {
            ticket: updatedTicket,
            oldStatus: ticket.status,
            newStatus: body.status,
            relatedEntity: {
              type: ticket.ticketType,
              id: id,
            },
          }
        )
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
      }

      return NextResponse.json({
        success: true,
        ticket: updatedTicket,
      })
    }

    // General update
    const updatedTicket = await UnifiedTicketService.update(id, session.user.orgId, body)

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    })
  } catch (error: any) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/unified-tickets/[id] - Delete a unified ticket
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check type-specific delete permission
    const typePermissions: Record<string, string> = {
      ticket: 'tickets.delete',
      incident: 'incidents.delete',
      service_request: 'service_requests.delete',
      change: 'changes.delete',
      problem: 'problems.delete',
    }

    const permission = typePermissions[ticket.ticketType] || 'tickets.delete'
    const hasPermission = await requirePermission(session, permission)

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(permission) },
        { status: 403 }
      )
    }

    await UnifiedTicketService.delete(id, session.user.orgId)

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
