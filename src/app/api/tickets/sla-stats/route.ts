import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

/**
 * GET /api/tickets/sla-stats
 * Get SLA statistics for tickets (legacy endpoint - backward compatibility)
 *
 * This endpoint provides SLA compliance metrics for the organization's tickets.
 * It works with the unified ticketing system.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get all tickets from unified_tickets collection
    const tickets = await db.collection('unified_tickets')
      .find({ orgId })
      .toArray()

    const totalTickets = tickets.length

    // Calculate SLA compliance
    const now = new Date()
    let metSLA = 0
    let breachedSLA = 0
    let atRiskSLA = 0

    tickets.forEach(ticket => {
      if (!ticket.sla) {
        return // Skip tickets without SLA
      }

      const { responseTime, resolutionTime } = ticket.sla

      // Check response time SLA
      if (responseTime?.breached) {
        breachedSLA++
      } else if (responseTime?.isAtRisk) {
        atRiskSLA++
      } else if (responseTime?.met) {
        metSLA++
      }

      // Also check resolution time SLA (only count if not already counted)
      if (!responseTime || (!responseTime.breached && !responseTime.isAtRisk)) {
        if (resolutionTime?.breached) {
          breachedSLA++
        } else if (resolutionTime?.isAtRisk) {
          atRiskSLA++
        } else if (resolutionTime?.met) {
          metSLA++
        }
      }
    })

    // Calculate percentages
    const totalWithSLA = metSLA + breachedSLA + atRiskSLA
    const complianceRate = totalWithSLA > 0 ? (metSLA / totalWithSLA) * 100 : 100
    const breachRate = totalWithSLA > 0 ? (breachedSLA / totalWithSLA) * 100 : 0
    const atRiskRate = totalWithSLA > 0 ? (atRiskSLA / totalWithSLA) * 100 : 0

    // Calculate average response and resolution times
    let totalResponseTime = 0
    let totalResolutionTime = 0
    let responseCount = 0
    let resolutionCount = 0

    tickets.forEach(ticket => {
      if (ticket.sla?.responseTime?.actualMinutes !== undefined) {
        totalResponseTime += ticket.sla.responseTime.actualMinutes
        responseCount++
      }
      if (ticket.sla?.resolutionTime?.actualMinutes !== undefined) {
        totalResolutionTime += ticket.sla.resolutionTime.actualMinutes
        resolutionCount++
      }
    })

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0
    const avgResolutionTime = resolutionCount > 0 ? Math.round(totalResolutionTime / resolutionCount) : 0

    return NextResponse.json({
      success: true,
      data: {
        totalTickets,
        totalWithSLA,
        slaCompliance: {
          met: metSLA,
          breached: breachedSLA,
          atRisk: atRiskSLA
        },
        percentages: {
          complianceRate: Math.round(complianceRate * 10) / 10,
          breachRate: Math.round(breachRate * 10) / 10,
          atRiskRate: Math.round(atRiskRate * 10) / 10
        },
        averageTimes: {
          responseMinutes: avgResponseTime,
          resolutionMinutes: avgResolutionTime
        }
      }
    })
  } catch (error) {
    console.error('Error fetching SLA stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLA statistics' },
      { status: 500 }
    )
  }
}
