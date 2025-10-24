import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MilestoneService } from '@/lib/services/project-milestones'
import { requirePermission } from '@/lib/middleware/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.edit.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { milestoneId } = await params

    const milestone = await MilestoneService.achieveMilestone(
      milestoneId,
      session.user.orgId,
      session.user.id
    )

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone marked as achieved',
    })
  } catch (error) {
    console.error('Achieve milestone error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to achieve milestone' },
      { status: 500 }
    )
  }
}
