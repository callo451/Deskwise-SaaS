import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SLAEscalationService } from '@/lib/services/sla-escalation'

/**
 * GET /api/tickets/[id]/escalation-history
 * Get escalation history for a ticket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const history = await SLAEscalationService.getEscalationHistory(
      id,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error('Error fetching escalation history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch escalation history' },
      { status: 500 }
    )
  }
}
