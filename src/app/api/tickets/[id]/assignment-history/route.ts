import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const client = await clientPromise
    const db = client.db('deskwise')

    // Verify ticket exists and belongs to org
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get assignment history from audit logs
    const auditLogs = await db
      .collection('audit_logs')
      .find({
        orgId: session.user.orgId,
        entityType: 'ticket',
        entityId: id,
        action: { $in: ['ticket.assigned', 'ticket.unassigned', 'ticket.reassigned'] },
      })
      .sort({ timestamp: -1 })
      .toArray()

    // Enrich with user information
    const userIds = [
      ...new Set(
        auditLogs.flatMap(log => [
          log.userId,
          log.details?.assignedTo,
          log.details?.previousAssignee,
        ].filter(Boolean))
      ),
    ]

    const users = await db
      .collection('users')
      .find({
        _id: { $in: userIds.map(id => new ObjectId(id as string)) },
        orgId: session.user.orgId,
      })
      .toArray()

    const userMap = new Map(
      users.map(u => [
        u._id.toString(),
        {
          id: u._id.toString(),
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
        },
      ])
    )

    // Format the history entries
    const history = auditLogs.map(log => ({
      _id: log._id.toString(),
      action: log.action,
      timestamp: log.timestamp,
      performedBy: userMap.get(log.userId),
      assignedTo: log.details?.assignedTo ? userMap.get(log.details.assignedTo) : null,
      previousAssignee: log.details?.previousAssignee
        ? userMap.get(log.details.previousAssignee)
        : null,
      details: log.details,
    }))

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error('Get assignment history error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment history' },
      { status: 500 }
    )
  }
}
