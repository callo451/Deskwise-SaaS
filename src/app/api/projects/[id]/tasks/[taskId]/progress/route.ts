import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { ProjectPermissionService } from '@/lib/services/project-permissions'
import { z } from 'zod'

const updateProgressSchema = z.object({
  percentComplete: z.number().min(0).max(100),
})

/**
 * PUT /api/projects/[id]/tasks/[taskId]/progress
 * Update task progress percentage
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, taskId } = await params

    // Fetch project first to verify it exists
    const project = await ProjectService.getProjectById(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Fetch all tasks to get the specific task
    const tasks = await ProjectService.getTasks(id)
    const existingTask = tasks.find((t: any) => t._id?.toString() === taskId)

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check task edit permission (context-aware)
    const canEdit = await ProjectPermissionService.canEditTask(session, existingTask)
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to edit this task' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateProgressSchema.parse(body)

    const task = await ProjectService.updateTaskProgress(
      taskId,
      id,
      session.user.orgId,
      validatedData.percentComplete
    )

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task progress updated successfully',
    })
  } catch (error) {
    console.error('Update task progress error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update task progress' },
      { status: 500 }
    )
  }
}
