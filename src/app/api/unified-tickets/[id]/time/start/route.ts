import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketTimeService } from '@/lib/services/unified-ticket-time'
import {
  requireAnyPermission,
  createMultiplePermissionError,
} from '@/lib/middleware/permissions'
import { z } from 'zod'

const startTimerSchema = z.object({
  description: z.string().optional(),
})

/**
 * POST /api/unified-tickets/[id]/time/start - Start a timer for a ticket
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
    const validatedData = startTimerSchema.parse(body)

    const timer = await UnifiedTicketTimeService.startTimer(
      id,
      session.user.orgId,
      session.user.userId,
      validatedData.description ? { description: validatedData.description } : undefined
    )

    return NextResponse.json({
      success: true,
      timer,
    })
  } catch (error: any) {
    console.error('Error starting timer:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
