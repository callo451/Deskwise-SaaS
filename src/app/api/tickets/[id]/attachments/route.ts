import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { TicketService } from '@/lib/services/tickets'
import { FileStorageService } from '@/lib/services/file-storage'
import { TicketAttachment } from '@/lib/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total per ticket

/**
 * GET /api/tickets/[id]/attachments
 * Get all attachments for a ticket
 */
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

    // Check RBAC permissions
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
    const ticket = await TicketService.getTicketById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: ticket.attachments || [],
    })
  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tickets/[id]/attachments
 * Upload one or more files to a ticket
 */
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

    // Check RBAC permissions - need edit permission to add attachments
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

    // Get ticket
    const ticket = await TicketService.getTicketById(id, session.user.orgId)

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate total size
    const existingAttachments = ticket.attachments || []
    const existingSize = FileStorageService.calculateTotalSize(existingAttachments)
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0)

    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Total attachment size exceeds maximum allowed size of ${
            MAX_TOTAL_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      )
    }

    // Process each file
    const uploadedAttachments: TicketAttachment[] = []
    const errors: string[] = []

    for (const file of files) {
      try {
        // Validate individual file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(
            `${file.name}: File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
          )
          continue
        }

        // Save file
        const storedFile = await FileStorageService.saveFile(file, {
          maxFileSize: MAX_FILE_SIZE,
          generateThumbnail: file.type.startsWith('image/'),
        })

        // Create attachment metadata
        const attachment: TicketAttachment = {
          id: storedFile.id,
          filename: storedFile.filename,
          originalFilename: storedFile.originalFilename,
          contentType: storedFile.contentType,
          size: storedFile.size,
          uploadedBy: session.user.id,
          uploadedAt: new Date(),
          url: storedFile.url,
          thumbnailUrl: storedFile.thumbnailUrl,
        }

        uploadedAttachments.push(attachment)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${file.name}: ${errorMessage}`)
      }
    }

    // Update ticket with new attachments
    if (uploadedAttachments.length > 0) {
      const updatedAttachments = [...existingAttachments, ...uploadedAttachments]

      await TicketService.updateTicket(id, session.user.orgId, {
        // @ts-ignore - attachments field exists but TypeScript doesn't know about it in UpdateTicketInput
        attachments: updatedAttachments,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        uploaded: uploadedAttachments,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Successfully uploaded ${uploadedAttachments.length} file(s)${
        errors.length > 0 ? ` with ${errors.length} error(s)` : ''
      }`,
    })
  } catch (error) {
    console.error('Upload attachments error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload attachments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tickets/[id]/attachments/[attachmentId]
 * Delete a specific attachment
 * Note: This will be implemented in a separate route file
 */
