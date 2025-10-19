import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const orgId = session.user.orgId
    const userId = session.user.userId

    // Get counts for various entities
    const [
      totalUsers,
      activeUsers,
      totalTickets,
      openTickets,
      totalIncidents,
      activeIncidents,
      totalProjects,
      activeProjects,
    ] = await Promise.all([
      db.collection(COLLECTIONS.USERS).countDocuments({ orgId }),
      db.collection(COLLECTIONS.USERS).countDocuments({ orgId, isActive: true }),
      db.collection(COLLECTIONS.TICKETS).countDocuments({ orgId }),
      db.collection(COLLECTIONS.TICKETS).countDocuments({
        orgId,
        status: { $in: ['new', 'open', 'pending'] }
      }),
      db.collection(COLLECTIONS.INCIDENTS).countDocuments({ orgId }),
      db.collection(COLLECTIONS.INCIDENTS).countDocuments({
        orgId,
        status: { $in: ['investigating', 'identified', 'monitoring'] }
      }),
      db.collection(COLLECTIONS.PROJECTS).countDocuments({ orgId }),
      db.collection(COLLECTIONS.PROJECTS).countDocuments({
        orgId,
        status: 'active'
      }),
    ])

    // Calculate SLA compliance
    const ticketsWithSLA = await db.collection(COLLECTIONS.TICKETS)
      .find({ orgId, sla: { $exists: true } })
      .toArray()

    const slaCompliantTickets = ticketsWithSLA.filter(t => !t.sla?.breached).length
    const slaCompliance = ticketsWithSLA.length > 0
      ? (slaCompliantTickets / ticketsWithSLA.length) * 100
      : 100

    // Calculate MTTR (Mean Time to Repair) for resolved incidents
    const resolvedIncidents = await db.collection(COLLECTIONS.INCIDENTS)
      .find({ orgId, status: 'resolved', resolvedAt: { $exists: true } })
      .toArray()

    let mttrHours = 0
    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, incident) => {
        const start = new Date(incident.startedAt).getTime()
        const end = new Date(incident.resolvedAt).getTime()
        return sum + (end - start)
      }, 0)
      mttrHours = totalResolutionTime / resolvedIncidents.length / (1000 * 60 * 60) // Convert to hours
    }

    // Calculate overdue tickets
    const now = new Date()
    const overdueTickets = await db.collection(COLLECTIONS.TICKETS)
      .countDocuments({
        orgId,
        status: { $in: ['new', 'open', 'pending'] },
        'sla.resolutionDeadline': { $lt: now }
      })

    // Get tickets assigned to current user
    const myTickets = await db.collection(COLLECTIONS.TICKETS)
      .countDocuments({
        orgId,
        assignedTo: userId,
        status: { $in: ['new', 'open', 'pending'] }
      })

    // Get unassigned tickets
    const unassignedTickets = await db.collection(COLLECTIONS.TICKETS)
      .countDocuments({
        orgId,
        status: { $in: ['new', 'open', 'pending'] },
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: null },
          { assignedTo: '' }
        ]
      })

    // Calculate service health (uptime percentage based on incidents)
    // Simple calculation: 100% - (active incidents / total possible service hours this month)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentIncidents = await db.collection(COLLECTIONS.INCIDENTS)
      .find({
        orgId,
        startedAt: { $gte: thirtyDaysAgo }
      })
      .toArray()

    let totalDowntimeHours = 0
    recentIncidents.forEach(incident => {
      const start = new Date(incident.startedAt).getTime()
      const end = incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : now.getTime()
      totalDowntimeHours += (end - start) / (1000 * 60 * 60)
    })
    const totalHoursInMonth = 30 * 24
    const serviceHealth = Math.max(0, 100 - (totalDowntimeHours / totalHoursInMonth * 100))

    // Get recent activity (last 5 activities across tickets and incidents)
    const recentTickets = await db.collection(COLLECTIONS.TICKETS)
      .find({ orgId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray()

    const recentIncidentUpdates = await db.collection(COLLECTIONS.INCIDENTS)
      .find({ orgId })
      .sort({ updatedAt: -1 })
      .limit(2)
      .toArray()

    const recentActivity = [
      ...recentTickets.map(t => ({
        type: 'ticket',
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        updatedAt: t.updatedAt
      })),
      ...recentIncidentUpdates.map(i => ({
        type: 'incident',
        id: i._id.toString(),
        title: i.title,
        status: i.status,
        updatedAt: i.updatedAt
      }))
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          overdue: overdueTickets,
          myTickets,
          unassigned: unassignedTickets,
        },
        incidents: {
          total: totalIncidents,
          active: activeIncidents,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
        },
        sla: {
          compliance: parseFloat(slaCompliance.toFixed(1)),
          totalTracked: ticketsWithSLA.length,
          compliant: slaCompliantTickets,
          breached: ticketsWithSLA.length - slaCompliantTickets,
        },
        mttr: {
          hours: parseFloat(mttrHours.toFixed(1)),
          incidentsResolved: resolvedIncidents.length,
        },
        serviceHealth: {
          percentage: parseFloat(serviceHealth.toFixed(1)),
          downtimeHours: parseFloat(totalDowntimeHours.toFixed(1)),
        },
        recentActivity,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      },
      { status: 500 }
    )
  }
}
