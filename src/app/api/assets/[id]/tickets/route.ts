import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET /api/assets/[id]/tickets - Get all tickets linked to an asset
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orgId = session.user.orgId
    const client = await clientPromise
    const db = client.db('deskwise')

    // Verify asset exists and belongs to org
    const asset = await db.collection('assets').findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Find all tickets that have this asset linked
    const tickets = await db
      .collection('tickets')
      .find({
        orgId,
        linkedAssets: id,
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Enrich with user information if needed
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        // Get requester details
        let requesterName = 'Unknown'
        if (ticket.requesterId) {
          const requester = await db.collection('users').findOne({
            _id: new ObjectId(ticket.requesterId),
            orgId,
          })
          if (requester) {
            requesterName = `${requester.firstName} ${requester.lastName}`
          }
        }

        // Get assigned user details
        let assignedToName = null
        if (ticket.assignedTo) {
          const assignedUser = await db.collection('users').findOne({
            _id: new ObjectId(ticket.assignedTo),
            orgId,
          })
          if (assignedUser) {
            assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`
          }
        }

        return {
          ...ticket,
          requesterName,
          assignedToName,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: ticketsWithDetails,
      count: ticketsWithDetails.length,
    })
  } catch (error) {
    console.error('Error fetching asset tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset tickets' },
      { status: 500 }
    )
  }
}
