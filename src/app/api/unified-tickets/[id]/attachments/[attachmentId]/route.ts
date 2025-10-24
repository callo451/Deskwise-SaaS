import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  requireAnyPermission,
  requirePermission,
  createMultiplePermissionError,
  createPermissionError,
} from '@/lib/middleware/permissions'
import { getS3StorageService } from '@/lib/services/s3-storage'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { TicketAttachment } from '@/lib/types'

/**
 * GET /api/unified-tickets/[id]/attachments/[attachmentId] - Get presigned download URL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, attachmentId } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check view permission
    const hasPermission = await requireAnyPermission(session, ['tickets.view.all', 'tickets.view.own'])
    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.view.all', 'tickets.view.own'], false) },
        { status: 403 }
      )
    }

    // Verify ticket exists
    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get attachment from database
    const client = await clientPromise
    const db = client.db('deskwise')

    const attachment = await db
      .collection<TicketAttachment>('unified_ticket_attachments')
      .findOne({
        id: attachmentId,
        orgId: session.user.orgId,
        ticketId: id,
      })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Generate presigned URL (valid for 1 hour)
    const s3Service = getS3StorageService()
    const downloadUrl = await s3Service.getSignedUrl(
      attachment.s3Key,
      3600, // 1 hour
      attachment.originalFilename
    )

    return NextResponse.json({
      success: true,
      downloadUrl,
      attachment: {
        id: attachment.id,
        filename: attachment.originalFilename,
        fileSize: attachment.fileSize,
        contentType: attachment.contentType,
        uploadedBy: attachment.uploadedByName,
        uploadedAt: attachment.uploadedAt,
      },
    })
  } catch (error: any) {
    console.error('Error generating download URL:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/unified-tickets/[id]/attachments/[attachmentId] - Delete an attachment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id, attachmentId } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check delete permission (requires tickets.delete or tickets.edit.all)
    const canDelete = await requirePermission(session, 'tickets.delete')
    const canEdit = await requireAnyPermission(session, ['tickets.edit.all'])

    if (!canDelete && !canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete attachments' },
        { status: 403 }
      )
    }

    // Verify ticket exists
    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get attachment from database
    const client = await clientPromise
    const db = client.db('deskwise')

    const attachment = await db
      .collection<TicketAttachment>('unified_ticket_attachments')
      .findOne({
        id: attachmentId,
        orgId: session.user.orgId,
        ticketId: id,
      })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Delete from S3
    const s3Service = getS3StorageService()
    await s3Service.deleteFile(attachment.s3Key)

    // Delete from database
    await db.collection('unified_ticket_attachments').deleteOne({
      id: attachmentId,
      orgId: session.user.orgId,
      ticketId: id,
    })

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
