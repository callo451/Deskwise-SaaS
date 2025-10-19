import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SLAEscalationService } from '@/lib/services/sla-escalation'

/**
 * GET /api/tickets/at-risk
 * Get tickets at risk of SLA breach
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'on-time' | 'at-risk' | 'critical' | 'breached' | undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const tickets = await SLAEscalationService.getTicketsWithSLA(
      session.user.orgId,
      {
        slaStatus: status,
        limit,
      }
    )

    return NextResponse.json({
      success: true,
      data: tickets,
    })
  } catch (error) {
    console.error('Error fetching at-risk tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch at-risk tickets' },
      { status: 500 }
    )
  }
}
