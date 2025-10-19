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

    // Get total service requests count
    const totalRequests = await db.collection('service_requests')
      .countDocuments({ orgId: session.user.orgId })

    // Get pending requests count
    const pendingRequests = await db.collection('service_requests')
      .countDocuments({
        orgId: session.user.orgId,
        status: { $in: ['pending', 'in-progress'] }
      })

    // Get requests created in last 30 days for trend calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRequests = await db.collection('service_requests')
      .countDocuments({
        orgId: session.user.orgId,
        createdAt: { $gte: thirtyDaysAgo }
      })

    // Get requests from previous 30 days for comparison
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const previousPeriodRequests = await db.collection('service_requests')
      .countDocuments({
        orgId: session.user.orgId,
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      })

    // Calculate trend
    let trend = null
    if (previousPeriodRequests > 0) {
      const percentChange = ((recentRequests - previousPeriodRequests) / previousPeriodRequests) * 100
      trend = {
        direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
        value: `${Math.abs(Math.round(percentChange))}%`
      }
    }

    return NextResponse.json({
      value: pendingRequests,
      total: totalRequests,
      trend,
      label: 'Service Requests'
    })
  } catch (error) {
    console.error('Failed to fetch service request stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
