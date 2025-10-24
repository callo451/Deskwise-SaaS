import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketTimeService } from '@/lib/services/unified-ticket-time'
import {
  requireAnyPermission,
  createMultiplePermissionError,
} from '@/lib/middleware/permissions'
import { z } from 'zod'

const stopTimerSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  isBillable: z.boolean(),
})

/**
 * POST /api/unified-tickets/[id]/time/stop - Stop a running timer
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
    const validatedData = stopTimerSchema.parse(body)

    const entry = await UnifiedTicketTimeService.stopTimer(
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
    console.error('Error stopping timer:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
