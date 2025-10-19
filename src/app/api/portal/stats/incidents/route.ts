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

    // Get total incidents count
    const totalIncidents = await db.collection('incidents')
      .countDocuments({ orgId: session.user.orgId })

    // Get active incidents count
    const activeIncidents = await db.collection('incidents')
      .countDocuments({
        orgId: session.user.orgId,
        status: { $in: ['open', 'investigating', 'identified'] }
      })

    // Get incidents created in last 30 days for trend calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentIncidents = await db.collection('incidents')
      .countDocuments({
        orgId: session.user.orgId,
        createdAt: { $gte: thirtyDaysAgo }
      })

    // Get incidents from previous 30 days for comparison
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const previousPeriodIncidents = await db.collection('incidents')
      .countDocuments({
        orgId: session.user.orgId,
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      })

    // Calculate trend
    let trend = null
    if (previousPeriodIncidents > 0) {
      const percentChange = ((recentIncidents - previousPeriodIncidents) / previousPeriodIncidents) * 100
      trend = {
        direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
        value: `${Math.abs(Math.round(percentChange))}%`
      }
    }

    return NextResponse.json({
      value: activeIncidents,
      total: totalIncidents,
      trend,
      label: 'Active Incidents'
    })
  } catch (error) {
    console.error('Failed to fetch incident stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
