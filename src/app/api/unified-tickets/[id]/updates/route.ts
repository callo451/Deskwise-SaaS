import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/unified-tickets/[id]/updates - Get all updates for a ticket
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

    // Only incidents and problems support updates
    if (!['incident', 'problem'].includes(ticket.ticketType)) {
      return NextResponse.json(
        { error: 'Only incidents and problems support updates' },
        { status: 400 }
      )
    }

    const updates = await UnifiedTicketService.getUpdates(id, session.user.orgId)

    return NextResponse.json({
      success: true,
      updates,
      count: updates.length,
    })
  } catch (error: any) {
    console.error('Error fetching ticket updates:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/unified-tickets/[id]/updates - Add an update to an incident or problem
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

    // Only incidents and problems support updates
    if (!['incident', 'problem'].includes(ticket.ticketType)) {
      return NextResponse.json(
        { error: 'Only incidents and problems support updates' },
        { status: 400 }
      )
    }

    // Check permission to add updates (unified ticketing permissions)
    const updatePermission =
      ticket.ticketType === 'incident' ? 'tickets.manageIncident' : 'tickets.manageProblem'

    const hasPermission = await requirePermission(session, updatePermission)

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError(updatePermission) },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { message, updateType, status, isPublic } = body

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Update message must be at least 10 characters' },
        { status: 400 }
      )
    }

    const update = await UnifiedTicketService.addUpdate(
      id,
      session.user.orgId,
      {
        message,
        updateType,
        status,
        isPublic,
      },
      session.user.userId,
      session.user.name
    )

    return NextResponse.json({
      success: true,
      update,
      message: 'Update added successfully',
    })
  } catch (error: any) {
    console.error('Error adding ticket update:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
