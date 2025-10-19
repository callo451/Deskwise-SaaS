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
    const severity = searchParams.get('severity') // optional filter

    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query
    const query: any = { orgId: session.user.orgId }

    if (status && status !== 'all') {
      query.status = status
    }

    if (severity && severity !== 'all') {
      query.severity = severity
    }

    // Fetch incidents
    const incidents = await db.collection('incidents')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Format incidents for frontend
    const formattedIncidents = incidents.map(incident => ({
      id: incident._id.toString(),
      incidentNumber: incident.incidentNumber || incident._id.toString().slice(-6).toUpperCase(),
      title: incident.title || 'Untitled Incident',
      description: incident.description || '',
      status: incident.status || 'open',
      severity: incident.severity || 'medium',
      impact: incident.impact || 'medium',
      urgency: incident.urgency || 'medium',
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      resolvedAt: incident.resolvedAt || null,
      assignedTo: incident.assignedTo || null,
      assignedToName: incident.assignedToName || 'Unassigned',
      reportedBy: incident.reportedBy || incident.reportedByEmail || 'Unknown',
      category: incident.category || 'General',
      affectedServices: incident.affectedServices || [],
      tags: incident.tags || []
    }))

    return NextResponse.json(formattedIncidents)
  } catch (error) {
    console.error('Failed to fetch incidents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
