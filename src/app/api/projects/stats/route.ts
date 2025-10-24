import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { requirePermission } from '@/lib/middleware/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check analytics view permission
    const canViewAnalytics = await requirePermission(session, 'projects.analytics.view')
    if (!canViewAnalytics) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view project analytics' },
        { status: 403 }
      )
    }

    const stats = await ProjectService.getProjectStats(session.user.orgId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get project stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project statistics' },
      { status: 500 }
    )
  }
}
