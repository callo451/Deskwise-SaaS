import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MilestoneService } from '@/lib/services/project-milestones'
import { requirePermission } from '@/lib/middleware/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.view.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { milestoneId } = await params

    const deliverables = await MilestoneService.getDeliverables(
      milestoneId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: deliverables,
    })
  } catch (error) {
    console.error('Get deliverables error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deliverables' },
      { status: 500 }
    )
  }
}
