import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { UnifiedTicketCommentService } from '@/lib/services/unified-ticket-comments'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/unified-tickets/[id]/comments - Get all comments for a ticket
 *
 * Query params:
 * - includeInternal: boolean (default: false for end users, true for admins/technicians)
 * - includeDeleted: boolean (default: false)
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

    // Check view permission
    const hasPermission = await requirePermission(session, 'tickets.view.all')
    const canViewOwn = await requirePermission(session, 'tickets.view.own')

    if (!hasPermission && !canViewOwn) {
      return NextResponse.json(
        { error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    // If user can only view own tickets, verify they're the requester or assignee
    if (!hasPermission && canViewOwn) {
      const isOwner =
        ticket.requesterId === session.user.id || ticket.assignedTo === session.user.id

      if (!isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Determine if user can see internal comments
    // Admins and technicians can see internal, end users cannot
    const isAdminOrTechnician =
      session.user.role === 'admin' || session.user.role === 'technician'
    const canViewInternal =
      isAdminOrTechnician || (await requirePermission(session, 'tickets.comment.internal'))

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const comments = await UnifiedTicketCommentService.getAll(id, session.user.orgId, {
      includeInternal: canViewInternal,
      includeDeleted: includeDeleted && isAdminOrTechnician, // Only admins can see deleted
    })

    return NextResponse.json({
      success: true,
      comments,
      count: comments.length,
      canViewInternal,
    })
  } catch (error: any) {
    console.error('Error fetching ticket comments:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/unified-tickets/[id]/comments - Add a comment to a ticket
 *
 * Body:
 * - content: string (required, min 1 character)
 * - isInternal: boolean (optional, default: false)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check comment permission
    const hasPermission = await requirePermission(session, 'tickets.comment')

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError('tickets.comment') },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { content, isInternal } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Comment content must be less than 10,000 characters' },
        { status: 400 }
      )
    }

    // Validate isInternal flag
    // Only admins and technicians can create internal comments
    const requestedInternal = isInternal === true
    const isAdminOrTechnician =
      session.user.role === 'admin' || session.user.role === 'technician'
    const canCreateInternal =
      isAdminOrTechnician || (await requirePermission(session, 'tickets.comment.internal'))

    if (requestedInternal && !canCreateInternal) {
      return NextResponse.json(
        {
          error: 'Only administrators and technicians can create internal comments',
        },
        { status: 403 }
      )
    }

    const comment = await UnifiedTicketCommentService.create(id, session.user.orgId, {
      content: content.trim(),
      isInternal: requestedInternal,
      createdBy: session.user.id,
      createdByName: session.user.name || 'Unknown User',
      createdByAvatar: session.user.avatar,
    })

    return NextResponse.json(
      {
        success: true,
        comment,
        message: 'Comment added successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding ticket comment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
