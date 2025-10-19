import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketService } from '@/lib/services/tickets'
import { requirePermission, requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'
import { z } from 'zod'

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().min(1, 'Category is required'),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sla: z.object({
    responseTime: z.number().positive(),
    resolutionTime: z.number().positive(),
  }).optional(),
})

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)

    const filters: any = {}

    if (searchParams.get('status')) {
      const statuses = searchParams.get('status')!.split(',')
      filters.status = statuses.length === 1 ? statuses[0] : statuses
    }

    if (searchParams.get('priority')) {
      const priorities = searchParams.get('priority')!.split(',')
      filters.priority = priorities.length === 1 ? priorities[0] : priorities
    }

    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!
    }

    if (searchParams.get('assignedTo')) {
      const assignedTo = searchParams.get('assignedTo')!
      if (assignedTo === 'null') {
        filters.assignedTo = null
      } else {
        filters.assignedTo = assignedTo
      }
    }

    if (searchParams.get('clientId')) {
      filters.clientId = searchParams.get('clientId')!
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    // Pagination parameters
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page')!, 10)
    }

    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!, 10)
    }

    const result = await TicketService.getTickets(session.user.orgId, filters)

    return NextResponse.json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - user needs create permission
    const hasPermission = await requirePermission(session, 'tickets.create')

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.create') },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTicketSchema.parse(body)

    const ticket = await TicketService.createTicket(
      session.user.orgId,
      validatedData,
      session.user.id
    )

    // Trigger notification for ticket creation
    try {
      await NotificationEngine.triggerNotification(
        session.user.orgId,
        NotificationEvent.TICKET_CREATED,
        {
          ticket,
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

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Ticket created successfully',
    })
  } catch (error) {
    console.error('Create ticket error:', error)

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
      { success: false, error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
