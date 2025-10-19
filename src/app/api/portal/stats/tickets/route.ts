import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('deskwise')

    // Get total ticket count
    const totalTickets = await db.collection('tickets')
      .countDocuments({ orgId: session.user.orgId })

    // Get open tickets count
    const openTickets = await db.collection('tickets')
      .countDocuments({
        orgId: session.user.orgId,
        status: { $in: ['open', 'in-progress'] }
      })

    // Get tickets created in last 30 days for trend calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTickets = await db.collection('tickets')
      .countDocuments({
        orgId: session.user.orgId,
        createdAt: { $gte: thirtyDaysAgo }
      })

    // Get tickets from previous 30 days for comparison
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const previousPeriodTickets = await db.collection('tickets')
      .countDocuments({
        orgId: session.user.orgId,
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      })

    // Calculate trend
    let trend = null
    if (previousPeriodTickets > 0) {
      const percentChange = ((recentTickets - previousPeriodTickets) / previousPeriodTickets) * 100
      trend = {
        direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
        value: `${Math.abs(Math.round(percentChange))}%`
      }
    }

    return NextResponse.json({
      value: openTickets,
      total: totalTickets,
      trend,
      label: 'Open Tickets'
    })
  } catch (error) {
    console.error('Failed to fetch ticket stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
