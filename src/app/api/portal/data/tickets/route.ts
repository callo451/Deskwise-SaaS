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

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status') // optional filter
    const priority = searchParams.get('priority') // optional filter

    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query
    const query: any = { orgId: session.user.orgId }

    if (status && status !== 'all') {
      query.status = status
    }

    if (priority && priority !== 'all') {
      query.priority = priority
    }

    // Fetch tickets
    const tickets = await db.collection('tickets')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Format tickets for frontend
    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber || ticket._id.toString().slice(-6).toUpperCase(),
      title: ticket.title || ticket.subject || 'Untitled Ticket',
      description: ticket.description || '',
      status: ticket.status || 'open',
      priority: ticket.priority || 'medium',
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      assignedTo: ticket.assignedTo || null,
      assignedToName: ticket.assignedToName || 'Unassigned',
      requester: ticket.requester || ticket.requesterEmail || 'Unknown',
      category: ticket.category || 'General',
      tags: ticket.tags || []
    }))

    return NextResponse.json(formattedTickets)
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
