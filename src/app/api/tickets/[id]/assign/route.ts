import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketService } from '@/lib/services/tickets'
import { UserService } from '@/lib/services/users'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'
import { z } from 'zod'

const assignTicketSchema = z.object({
  assignedTo: z.string().nullable(),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions
    const hasPermission = await requirePermission(session, 'tickets.assign')

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.assign') },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = assignTicketSchema.parse(body)

    // If assigning to a user, validate the user exists and belongs to same org
    if (validatedData.assignedTo) {
      const user = await UserService.getUserById(validatedData.assignedTo, session.user.orgId)

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found or does not belong to your organization' },
          { status: 400 }
        )
      }

      // Only allow assignment to admins and technicians
      if (user.role === 'user') {
        return NextResponse.json(
          { success: false, error: 'Tickets can only be assigned to administrators and technicians' },
          { status: 400 }
        )
      }
    }

    // Update the ticket assignment
    const ticket = await TicketService.assignTicket(
      id,
      session.user.orgId,
      validatedData.assignedTo,
      session.user.id
    )

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Send notification to assigned user
    if (validatedData.assignedTo) {
      try {
        await NotificationEngine.triggerNotification(
          session.user.orgId,
          NotificationEvent.TICKET_ASSIGNED,
          {
            ticket,
            assignedTo: validatedData.assignedTo,
            relatedEntity: {
              type: 'ticket',
              id: ticket._id.toString()
            }
          },
          session.user.id
        )
      } catch (notificationError) {
        // Log but don't fail the request if notification fails
        console.error('Failed to send notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      message: validatedData.assignedTo
        ? 'Ticket assigned successfully'
        : 'Ticket unassigned successfully',
    })
  } catch (error) {
    console.error('Assign ticket error:', error)

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
      { success: false, error: 'Failed to assign ticket' },
      { status: 500 }
    )
  }
}
