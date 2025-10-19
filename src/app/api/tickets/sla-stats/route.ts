import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SLAEscalationService } from '@/lib/services/sla-escalation'

/**
 * GET /api/tickets/sla-stats
 * Get SLA statistics for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await SLAEscalationService.getSLAStats(session.user.orgId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching SLA stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SLA statistics' },
      { status: 500 }
    )
  }
}
