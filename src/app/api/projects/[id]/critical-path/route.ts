import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { ProjectPermissionService } from '@/lib/services/project-permissions'

/**
 * POST /api/projects/[id]/critical-path
 * Calculate and update critical path for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Fetch project first to check permissions
    const project = await ProjectService.getProjectById(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user can view this project
    const canView = await ProjectPermissionService.canViewProject(session, project)
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view this project' },
        { status: 403 }
      )
    }

    // Calculate critical path
    await ProjectService.calculateCriticalPath(id, session.user.orgId)

    // Return updated tasks
    const tasks = await ProjectService.getTasks(id)

    return NextResponse.json({
      success: true,
      data: tasks,
      message: 'Critical path calculated successfully',
    })
  } catch (error) {
    console.error('Calculate critical path error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate critical path' },
      { status: 500 }
    )
  }
}
