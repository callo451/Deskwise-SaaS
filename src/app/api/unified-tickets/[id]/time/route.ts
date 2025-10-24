import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketTimeService } from '@/lib/services/unified-ticket-time'
import {
  requirePermission,
  requireAnyPermission,
  createMultiplePermissionError,
} from '@/lib/middleware/permissions'
import { z } from 'zod'

const addTimeEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hours: z.number().min(0).max(999),
  minutes: z.number().min(0).max(59),
  isBillable: z.boolean(),
})

const deleteTimeEntrySchema = z.object({
  entryId: z.string().min(1, 'Entry ID is required'),
})

/**
 * GET /api/unified-tickets/[id]/time - Get time entries for a ticket
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
    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.view.all', 'tickets.view.own'], false) },
        { status: 403 }
      )
    }

    const entries = await UnifiedTicketTimeService.getTimeEntries(id, session.user.orgId)
    const stats = await UnifiedTicketTimeService.getTicketTimeStats(id, session.user.orgId)

    return NextResponse.json({
      success: true,
      entries,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/unified-tickets/[id]/time - Add a manual time entry
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId || !session?.user?.userId || !session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check edit permission
    const hasPermission = await requireAnyPermission(session, [
      'tickets.edit.all',
      'tickets.edit.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.edit.all', 'tickets.edit.own'], false) },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = addTimeEntrySchema.parse(body)

    const entry = await UnifiedTicketTimeService.addTimeEntry(
      id,
      session.user.orgId,
      session.user.userId,
      session.user.name,
      validatedData
    )

    return NextResponse.json({
      success: true,
      entry,
    })
  } catch (error: any) {
    console.error('Error adding time entry:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/unified-tickets/[id]/time - Delete a time entry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check edit permission
    const hasPermission = await requireAnyPermission(session, [
      'tickets.edit.all',
      'tickets.edit.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { error: createMultiplePermissionError(['tickets.edit.all', 'tickets.edit.own'], false) },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { entryId } = deleteTimeEntrySchema.parse(body)

    // Check if user is admin (has tickets.edit.all permission)
    const isAdmin = await requirePermission(session, 'tickets.edit.all')

    // Pass userId only if not admin (admins can delete any entry)
    const deleted = await UnifiedTicketTimeService.deleteTimeEntry(
      entryId,
      session.user.orgId,
      isAdmin ? undefined : session.user.userId
    )

    if (!deleted) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Time entry deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting time entry:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
