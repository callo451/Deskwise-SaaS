import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketService } from '@/lib/services/tickets'
import { requirePermission, requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'
import { z } from 'zod'

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['new', 'open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - user needs at least one view permission
    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.assigned',
      'tickets.view.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { id } = await params
    const ticket = await TicketService.getTicketById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - user needs at least one edit permission
    const hasPermission = await requireAnyPermission(session, [
      'tickets.edit.all',
      'tickets.edit.assigned',
      'tickets.edit.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.edit') },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTicketSchema.parse(body)

    // Get the original ticket to detect changes
    const originalTicket = await TicketService.getTicketById(id, session.user.orgId)

    if (!originalTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const ticket = await TicketService.updateTicket(
      id,
      session.user.orgId,
      validatedData
    )

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Trigger notifications based on what changed
    try {
      // Status change notification
      if (validatedData.status && originalTicket.status !== validatedData.status) {
        await NotificationEngine.triggerNotification(
          session.user.orgId,
          NotificationEvent.TICKET_STATUS_CHANGED,
          {
            ticket: {
              ...ticket,
              previousStatus: originalTicket.status
            },
            relatedEntity: {
              type: 'ticket',
              id: ticket._id.toString()
            }
          },
          session.user.id
        )

        // Resolved notification
        if (validatedData.status === 'resolved') {
          await NotificationEngine.triggerNotification(
            session.user.orgId,
            NotificationEvent.TICKET_RESOLVED,
            {
              ticket,
              relatedEntity: {
                type: 'ticket',
                id: ticket._id.toString()
              }
            },
            session.user.id
          )
        }
      }

      // General update notification (if not just a status change)
      if (!validatedData.status || (validatedData.status && Object.keys(validatedData).length > 1)) {
        await NotificationEngine.triggerNotification(
          session.user.orgId,
          NotificationEvent.TICKET_UPDATED,
          {
            ticket,
            changes: validatedData,
            relatedEntity: {
              type: 'ticket',
              id: ticket._id.toString()
            }
          },
          session.user.id
        )
      }
    } catch (notificationError) {
      // Log but don't fail the request if notification fails
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Ticket updated successfully',
    })
  } catch (error) {
    console.error('Update ticket error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - user needs delete permission
    const hasPermission = await requirePermission(session, 'tickets.delete')

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.delete') },
        { status: 403 }
      )
    }

    const { id } = await params
    const success = await TicketService.deleteTicket(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully',
    })
  } catch (error) {
    console.error('Delete ticket error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
