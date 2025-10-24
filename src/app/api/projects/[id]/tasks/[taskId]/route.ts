import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { ProjectPermissionService } from '@/lib/services/project-permissions'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

// Schema for TaskDependency
const taskDependencySchema = z.object({
  taskId: z.string(),
  type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']),
  lag: z.number().default(0),
})

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'review', 'completed', 'cancelled']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  // Support both legacy string[] and new TaskDependency[] format
  dependencies: z.union([
    z.array(z.string()),
    z.array(taskDependencySchema)
  ]).optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  remainingHours: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

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
    const validatedData = updateTaskSchema.parse(body)

    // Convert date strings to Date objects if provided
    const updates: any = { ...validatedData }
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate)
    }
    if (updates.completedAt) {
      updates.completedAt = new Date(updates.completedAt)
    }
    if (updates.plannedStartDate) {
      updates.plannedStartDate = new Date(updates.plannedStartDate)
    }
    if (updates.plannedEndDate) {
      updates.plannedEndDate = new Date(updates.plannedEndDate)
    }
    if (updates.actualStartDate) {
      updates.actualStartDate = new Date(updates.actualStartDate)
    }

    const task = await ProjectService.updateTask(
      taskId,
      id,
      session.user.orgId,
      updates
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
      message: 'Task updated successfully',
    })
  } catch (error) {
    console.error('Update task error:', error)

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
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify project exists
    const project = await ProjectService.getProjectById(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check task delete permission
    const canDelete = await requirePermission(session, 'projects.tasks.delete')
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to delete tasks' },
        { status: 403 }
      )
    }

    const success = await ProjectService.deleteTask(
      taskId,
      id,
      session.user.orgId
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
