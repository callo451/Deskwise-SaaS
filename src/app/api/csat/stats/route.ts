import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CSATService } from '@/lib/services/csat'

/**
 * GET /api/csat/stats
 * Get CSAT statistics with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const assignedTo = searchParams.get('assignedTo')
    const minRating = searchParams.get('minRating')
    const maxRating = searchParams.get('maxRating')

    const filters: any = {}

    if (startDate) {
      filters.startDate = new Date(startDate)
    }
    if (endDate) {
      filters.endDate = new Date(endDate)
    }
    if (category) {
      filters.category = category
    }
    if (assignedTo) {
      filters.assignedTo = assignedTo
    }
    if (minRating) {
      filters.minRating = parseInt(minRating, 10)
    }
    if (maxRating) {
      filters.maxRating = parseInt(maxRating, 10)
    }

    const stats = await CSATService.getCSATStats(session.user.orgId, filters)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching CSAT stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CSAT statistics' },
      { status: 500 }
    )
  }
}
