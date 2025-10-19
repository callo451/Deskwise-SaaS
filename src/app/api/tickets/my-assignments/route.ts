import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketService } from '@/lib/services/tickets'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupByStatus = searchParams.get('groupByStatus') === 'true'

    // Get all tickets assigned to the current user
    const result = await TicketService.getTickets(session.user.orgId, {
      assignedTo: session.user.id,
    })

    if (groupByStatus) {
      // Group tickets by status
      const grouped = {
        new: result.tickets.filter(t => t.status === 'new'),
        open: result.tickets.filter(t => t.status === 'open'),
        pending: result.tickets.filter(t => t.status === 'pending'),
        resolved: result.tickets.filter(t => t.status === 'resolved'),
        closed: result.tickets.filter(t => t.status === 'closed'),
      }

      const stats = {
        total: result.tickets.length,
        new: grouped.new.length,
        open: grouped.open.length,
        pending: grouped.pending.length,
        resolved: grouped.resolved.length,
        closed: grouped.closed.length,
        active: grouped.new.length + grouped.open.length + grouped.pending.length,
      }

      return NextResponse.json({
        success: true,
        data: {
          grouped,
          stats,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Get my assignments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assigned tickets' },
      { status: 500 }
    )
  }
}
