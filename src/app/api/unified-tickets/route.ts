import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { CreateUnifiedTicketInput, TicketType } from '@/lib/types'
import { requirePermission, requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'

/**
 * GET /api/unified-tickets - List all unified tickets with optional filters
 * Supports filtering by type to get tickets, incidents, changes, service requests, or problems
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check RBAC permissions - require at least one view permission
    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.assigned',
      'tickets.view.own',
      'incidents.view',
      'changes.view',
      'service_requests.view',
      'problems.view',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)

    // Extract filters from query params
    const filters: any = {}

    // Ticket type filter (ticket, incident, change, service_request, problem)
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as TicketType
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }

    if (searchParams.get('assignedTo')) {
      filters.assignedTo = searchParams.get('assignedTo')
    }

    if (searchParams.get('requesterId')) {
      filters.requesterId = searchParams.get('requesterId')
    }

    if (searchParams.get('clientId')) {
      filters.clientId = searchParams.get('clientId')
    }

    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')
    }

    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!)
    }

    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!)
    }

    const tickets = await UnifiedTicketService.getAll(session.user.orgId, filters)

    return NextResponse.json({
      success: true,
      tickets,
      count: tickets.length,
    })
  } catch (error: any) {
    console.error('Error fetching unified tickets:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/unified-tickets - Create a new unified ticket
 * Type-aware creation supporting all ticket types
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const input: CreateUnifiedTicketInput = body

    // Validate required fields
    if (!input.type) {
      return NextResponse.json({ error: 'Ticket type is required' }, { status: 400 })
    }

    // Type-specific RBAC permission checks
    let requiredPermission = ''
    switch (input.type) {
      case 'ticket':
        requiredPermission = 'tickets.create'
        break
      case 'incident':
        requiredPermission = 'incidents.create'
        break
      case 'service_request':
        requiredPermission = 'service_requests.create'
        break
      case 'change':
        requiredPermission = 'changes.create'
        break
      case 'problem':
        requiredPermission = 'problems.create'
        break
      default:
        return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 })
    }

    const hasPermission = await requirePermission(session, requiredPermission)
    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(requiredPermission) },
        { status: 403 }
      )
    }

    // Type-specific validation
    if (!input.title || !input.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    if (input.type === 'incident') {
      if (!input.severity || !input.impact || !input.urgency || !input.affectedServices) {
        return NextResponse.json(
          { error: 'Severity, impact, urgency, and affected services are required for incidents' },
          { status: 400 }
        )
      }
    }

    if (input.type === 'change') {
      if (!input.risk || !input.backoutPlan || !input.plannedStartDate || !input.plannedEndDate) {
        return NextResponse.json(
          { error: 'Risk, backout plan, and planned dates are required for changes' },
          { status: 400 }
        )
      }
    }

    if (input.type === 'service_request') {
      if (!input.category) {
        return NextResponse.json(
          { error: 'Category is required for service requests' },
          { status: 400 }
        )
      }
    }

    if (input.type === 'problem') {
      if (!input.impact || !input.urgency) {
        return NextResponse.json(
          { error: 'Impact and urgency are required for problems' },
          { status: 400 }
        )
      }
    }

    // Create the ticket
    const ticket = await UnifiedTicketService.create(
      session.user.orgId,
      input,
      session.user.userId
    )

    // Trigger type-specific notification
    try {
      let notificationEvent: NotificationEvent
      switch (input.type) {
        case 'ticket':
          notificationEvent = NotificationEvent.TICKET_CREATED
          break
        case 'incident':
          notificationEvent = NotificationEvent.INCIDENT_CREATED
          break
        case 'service_request':
          notificationEvent = NotificationEvent.SERVICE_REQUEST_CREATED
          break
        case 'change':
          notificationEvent = NotificationEvent.CHANGE_CREATED
          break
        case 'problem':
          notificationEvent = NotificationEvent.PROBLEM_CREATED
          break
        default:
          notificationEvent = NotificationEvent.TICKET_CREATED
      }

      await NotificationEngine.triggerNotification(
        session.user.orgId,
        notificationEvent,
        {
          ticket,
          relatedEntity: {
            type: input.type,
            id: ticket._id.toString(),
          },
        }
      )
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
      // Don't fail ticket creation if notification fails
    }

    return NextResponse.json({
      success: true,
      ticket,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating unified ticket:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
