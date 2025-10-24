import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createMultiplePermissionError } from '@/lib/middleware/permissions'
import { getS3StorageService, S3StorageService } from '@/lib/services/s3-storage'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { TicketAttachment } from '@/lib/types'

/**
 * GET /api/unified-tickets/[id]/attachments - List all attachments for a ticket
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

    // Check view permission
    const hasPermission = await requireAnyPermission(session, ['tickets.view.all', 'tickets.view.own'])
    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.view.all', 'tickets.view.own'], false) },
        { status: 403 }
      )
    }

    // Verify ticket exists and belongs to organization
    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get attachments from database
    const client = await clientPromise
    const db = client.db('deskwise')
    const attachments = await db
      .collection<TicketAttachment>('unified_ticket_attachments')
      .find({ orgId: session.user.orgId, ticketId: id })
      .sort({ uploadedAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      attachments,
    })
  } catch (error: any) {
    console.error('Error listing attachments:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/unified-tickets/[id]/attachments - Upload a new attachment
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

    // Check edit permission (uploading attachments requires edit permission)
    const hasPermission = await requireAnyPermission(session, ['tickets.edit.all', 'tickets.edit.own'])
    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.edit.all', 'tickets.edit.own'], false) },
        { status: 403 }
      )
    }

    // Verify ticket exists and belongs to organization
    const ticket = await UnifiedTicketService.getById(id, session.user.orgId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const s3Service = getS3StorageService()
    const isValidType = S3StorageService.validateFileType(file.type)
    if (!isValidType) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate S3 key
    const s3Key = s3Service.generateTicketAttachmentKey(
      session.user.orgId,
      id,
      file.name
    )

    // Upload to S3
    const uploadResult = await s3Service.uploadFile(
      buffer,
      s3Key,
      file.type,
      {
        ticketId: id,
        orgId: session.user.orgId,
        uploadedBy: session.user.userId,
        originalFilename: file.name,
      }
    )

    // Create attachment record in database
    const client = await clientPromise
    const db = client.db('deskwise')

    const attachment: Omit<TicketAttachment, '_id'> & { orgId: string } = {
      id: new ObjectId().toString(),
      ticketId: id,
      orgId: session.user.orgId,
      filename: s3Key.split('/').pop() || file.name, // Extract filename from S3 key
      originalFilename: file.name,
      fileSize: file.size,
      contentType: file.type,
      s3Key,
      uploadedBy: session.user.userId,
      uploadedByName: session.user.name || session.user.email || 'Unknown',
      uploadedAt: new Date(),
    }

    const insertResult = await db.collection('unified_ticket_attachments').insertOne(attachment)

    // Return attachment with _id
    const savedAttachment = {
      ...attachment,
      _id: insertResult.insertedId,
    }

    return NextResponse.json({
      success: true,
      attachment: savedAttachment,
      message: 'File uploaded successfully',
    })
  } catch (error: any) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
