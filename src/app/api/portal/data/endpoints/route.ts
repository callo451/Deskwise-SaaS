import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/portal/data/endpoints
 * Get available API endpoints for portal blocks
 * Returns predefined endpoints for different data types
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const blockType = searchParams.get('blockType')

    // Define available endpoints by block type
    const endpointsByType: Record<string, Array<{ value: string; label: string; description: string; method: string }>> = {
      'ticket-list': [
        {
          value: '/api/tickets',
          label: 'All Tickets',
          description: 'Fetch all tickets for the current user',
          method: 'GET',
        },
        {
          value: '/api/tickets?status=open',
          label: 'Open Tickets',
          description: 'Fetch only open tickets',
          method: 'GET',
        },
        {
          value: '/api/tickets?assignedTo=current',
          label: 'My Assigned Tickets',
          description: 'Fetch tickets assigned to current user',
          method: 'GET',
        },
      ],
      'incident-list': [
        {
          value: '/api/incidents',
          label: 'All Incidents',
          description: 'Fetch all incidents',
          method: 'GET',
        },
        {
          value: '/api/incidents?status=investigating',
          label: 'Active Incidents',
          description: 'Fetch incidents currently being investigated',
          method: 'GET',
        },
        {
          value: '/api/incidents?isPublic=true',
          label: 'Public Incidents',
          description: 'Fetch public-facing incidents',
          method: 'GET',
        },
      ],
      'kb-article-list': [
        {
          value: '/api/knowledge-base',
          label: 'All Articles',
          description: 'Fetch all knowledge base articles',
          method: 'GET',
        },
        {
          value: '/api/knowledge-base?visibility=public',
          label: 'Public Articles',
          description: 'Fetch public articles only',
          method: 'GET',
        },
        {
          value: '/api/knowledge-base?status=published',
          label: 'Published Articles',
          description: 'Fetch only published articles',
          method: 'GET',
        },
      ],
      'service-catalog': [
        {
          value: '/api/service-catalog',
          label: 'All Services',
          description: 'Fetch all service catalog items',
          method: 'GET',
        },
        {
          value: '/api/service-catalog?isActive=true',
          label: 'Active Services',
          description: 'Fetch only active services',
          method: 'GET',
        },
      ],
      form: [
        {
          value: '/api/service-requests',
          label: 'Submit Service Request',
          description: 'Submit a new service request',
          method: 'POST',
        },
        {
          value: '/api/tickets',
          label: 'Create Ticket',
          description: 'Create a new support ticket',
          method: 'POST',
        },
      ],
    }

    // If blockType specified, return endpoints for that type
    if (blockType && endpointsByType[blockType]) {
      return NextResponse.json(endpointsByType[blockType])
    }

    // Otherwise return all endpoints
    return NextResponse.json(endpointsByType)
  } catch (error: any) {
    console.error('Error fetching endpoints for portal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
