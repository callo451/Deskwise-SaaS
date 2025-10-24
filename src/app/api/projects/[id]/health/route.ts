import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ProjectHealthService } from '@/lib/services/project-health'

/**
 * GET /api/projects/[id]/health
 * Get current health score and detailed breakdown for a project
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const orgId = session.user.orgId

    // Get health metrics (uses cache if available)
    const healthMetrics = await ProjectHealthService.getDetailedHealthMetrics(id, orgId)

    return NextResponse.json({
      success: true,
      data: healthMetrics,
    })
  } catch (error) {
    console.error('Error fetching project health:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch project health',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/health
 * Recalculate project health (admin only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can recalculate project health' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const orgId = session.user.orgId

    // Force recalculation
    const healthMetrics = await ProjectHealthService.calculateHealthScore(id, orgId, true)

    return NextResponse.json({
      success: true,
      message: 'Project health recalculated successfully',
      data: healthMetrics,
    })
  } catch (error) {
    console.error('Error recalculating project health:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to recalculate project health',
      },
      { status: 500 }
    )
  }
}
