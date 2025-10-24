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

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  // Support both legacy string[] and new TaskDependency[] format
  dependencies: z.union([
    z.array(z.string()),
    z.array(taskDependencySchema)
  ]).optional(),
  parentTaskId: z.string().optional(),
  taskType: z.enum(['task', 'milestone', 'summary']).optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

export async function GET(
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
    const project = await ProjectService.getProject(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user can view this project (inherits project view permissions)
    const canView = await ProjectPermissionService.canViewProject(session, project)
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view this project' },
        { status: 403 }
      )
    }

    const tasks = await ProjectService.getTasks(project._id.toString())

    return NextResponse.json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

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
    const project = await ProjectService.getProject(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check task create permission
    const canCreateTask = await requirePermission(session, 'projects.tasks.create')
    if (!canCreateTask) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to create tasks' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const task = await ProjectService.createTask(
      project._id.toString(),
      session.user.orgId,
      {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : undefined,
        plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : undefined,
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task created successfully',
    })
  } catch (error) {
    console.error('Create task error:', error)

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
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
