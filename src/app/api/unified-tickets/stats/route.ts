import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'
import { UnifiedTicketService } from '@/lib/services/unified-tickets'
import { TicketType } from '@/lib/types'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * GET /api/unified-tickets/stats - Get statistics for unified tickets
 * Optionally filter by type
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'incidents.view',
      'changes.view',
      'service_requests.view',
      'problems.view',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') as TicketType | null

    const filters = type ? { type } : undefined

    const stats = await UnifiedTicketService.getStats(session.user.orgId, filters)

    // Get stats by type if no specific type filter
    let statsByType = {}
    if (!type) {
      const types: TicketType[] = ['ticket', 'incident', 'service_request', 'change', 'problem']

      const typeStats = await Promise.all(
        types.map(async (t) => {
          const s = await UnifiedTicketService.getStats(session.user.orgId, { type: t })
          return { type: t, stats: s }
        })
      )

      statsByType = typeStats.reduce(
        (acc, { type, stats }) => {
          acc[type] = stats
          return acc
        },
        {} as Record<string, any>
      )
    }

    return NextResponse.json({
      success: true,
      overall: stats,
      byType: Object.keys(statsByType).length > 0 ? statsByType : undefined,
    })
  } catch (error: any) {
    console.error('Error fetching ticket stats:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
