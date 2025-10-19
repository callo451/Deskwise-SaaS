import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
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
