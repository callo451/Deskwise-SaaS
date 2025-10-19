import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { TicketService } from '@/lib/services/tickets'
import { FileStorageService } from '@/lib/services/file-storage'

/**
 * DELETE /api/tickets/[id]/attachments/[attachmentId]
 * Delete a specific attachment from a ticket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - need edit permission to delete attachments
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

    const { id, attachmentId } = await params

    // Get ticket
    const ticket = await TicketService.getTicketById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Find attachment
    const attachments = ticket.attachments || []
    const attachmentIndex = attachments.findIndex((a) => a.id === attachmentId)

    if (attachmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    const attachment = attachments[attachmentIndex]

    // Delete file from storage
    try {
      await FileStorageService.deleteFile(attachment.filename)
    } catch (error) {
      console.error('Failed to delete file from storage:', error)
      // Continue even if file deletion fails (file might already be deleted)
    }

    // Remove attachment from ticket
    const updatedAttachments = attachments.filter((a) => a.id !== attachmentId)

    await TicketService.updateTicket(id, session.user.orgId, {
      // @ts-ignore - attachments field exists but TypeScript doesn't know about it in UpdateTicketInput
      attachments: updatedAttachments,
    })

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    })
  } catch (error) {
    console.error('Delete attachment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attachment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
