import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketService } from '@/lib/services/tickets'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { NotificationEngine } from '@/lib/services/notification-engine'
import { NotificationEvent } from '@/lib/types'
import { z } from 'zod'

const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  isInternal: z.boolean().optional(),
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

    // Check RBAC permissions - user needs at least one view permission to see comments
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
    const comments = await TicketService.getComments(
      id,
      session.user.role,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: comments,
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Check RBAC permissions - user needs at least one edit permission to add comments
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
    const validatedData = addCommentSchema.parse(body)

    // Validate that only admins/technicians can create internal notes
    const isInternal = validatedData.isInternal || false
    if (isInternal && session.user.role === 'user') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only technicians and administrators can create internal notes',
        },
        { status: 403 }
      )
    }

    const comment = await TicketService.addComment(
      id,
      session.user.orgId,
      validatedData.content,
      session.user.id,
      isInternal
    )

    // Trigger notification for new comment (only for non-internal comments)
    if (!isInternal) {
      try {
        const ticket = await TicketService.getTicketById(id, session.user.orgId)

        if (ticket) {
          await NotificationEngine.triggerNotification(
            session.user.orgId,
            NotificationEvent.TICKET_COMMENT_ADDED,
            {
              ticket,
              comment: {
                ...comment,
                author: {
                  id: session.user.id,
                  name: session.user.name
                }
              },
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
    }

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    })
  } catch (error) {
    console.error('Add comment error:', error)

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
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
