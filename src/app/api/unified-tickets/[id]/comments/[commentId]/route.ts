import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketCommentService } from '@/lib/services/unified-ticket-comments'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * PUT /api/unified-tickets/[id]/comments/[commentId] - Update a comment
 *
 * Body:
 * - content: string (required, min 1 character)
 *
 * Only the comment creator or admins can update a comment
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, commentId } = await params

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the comment to verify ownership
    const comment = await UnifiedTicketCommentService.getById(commentId, session.user.orgId)

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Verify comment belongs to the ticket
    if (comment.ticketId !== id) {
      return NextResponse.json({ error: 'Comment does not belong to this ticket' }, { status: 400 })
    }

    // Check if comment is deleted
    if (comment.isDeleted) {
      return NextResponse.json({ error: 'Cannot edit deleted comment' }, { status: 400 })
    }

    // Check authorization - must be comment creator or admin
    const isCreator = comment.createdBy === session.user.id
    const isAdmin = session.user.role === 'admin'
    const hasAdminPermission = await requirePermission(session, 'tickets.manage')

    if (!isCreator && !isAdmin && !hasAdminPermission) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { content } = body

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

    const updatedComment = await UnifiedTicketCommentService.update(
      commentId,
      session.user.orgId,
      content.trim(),
      session.user.id,
      session.user.name
    )

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      message: 'Comment updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/unified-tickets/[id]/comments/[commentId] - Delete a comment (soft delete)
 *
 * Only the comment creator or admins can delete a comment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, commentId } = await params

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the comment to verify ownership
    const comment = await UnifiedTicketCommentService.getById(commentId, session.user.orgId)

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Verify comment belongs to the ticket
    if (comment.ticketId !== id) {
      return NextResponse.json({ error: 'Comment does not belong to this ticket' }, { status: 400 })
    }

    // Check if already deleted
    if (comment.isDeleted) {
      return NextResponse.json({ error: 'Comment is already deleted' }, { status: 400 })
    }

    // Check authorization - must be comment creator or admin
    const isCreator = comment.createdBy === session.user.id
    const isAdmin = session.user.role === 'admin'
    const hasAdminPermission = await requirePermission(session, 'tickets.manage')

    if (!isCreator && !isAdmin && !hasAdminPermission) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    const deleted = await UnifiedTicketCommentService.delete(commentId, session.user.orgId)

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
