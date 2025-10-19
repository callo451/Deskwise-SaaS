import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SLAEscalationService } from '@/lib/services/sla-escalation'

/**
 * POST /api/tickets/[id]/escalate
 * Manually escalate a ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only admins and technicians can escalate
    if (session.user.role !== 'admin' && session.user.role !== 'technician') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { escalatedTo, reason } = body

    const escalation = await SLAEscalationService.manualEscalation(
      id,
      session.user.orgId,
      session.user.userId,
      escalatedTo,
      reason
    )

    return NextResponse.json({
      success: true,
      data: escalation,
      message: 'Ticket escalated successfully',
    })
  } catch (error: any) {
    console.error('Error escalating ticket:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to escalate ticket' },
      { status: 500 }
    )
  }
}
