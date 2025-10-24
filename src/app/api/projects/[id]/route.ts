import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { ProjectPermissionService } from '@/lib/services/project-permissions'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  clientId: z.string().optional(),
  projectManager: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  budget: z.number().optional(),
  usedBudget: z.number().optional(),
  progress: z.number().optional(),
  tags: z.array(z.string()).optional(),
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
    const project = await ProjectService.getProject(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check context-aware view permission
    const canView = await ProjectPermissionService.canViewProject(session, project)
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view this project' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const existingProject = await ProjectService.getProject(id, session.user.orgId)

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check context-aware edit permission
    const canEdit = await ProjectPermissionService.canEditProject(session, existingProject)
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to edit this project' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Convert date strings to Date objects if provided
    const updates: any = { ...validatedData }
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate)
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate)
    }
    if (updates.actualStartDate) {
      updates.actualStartDate = new Date(updates.actualStartDate)
    }
    if (updates.actualEndDate) {
      updates.actualEndDate = new Date(updates.actualEndDate)
    }

    const project = await ProjectService.updateProject(
      existingProject._id.toString(),
      session.user.orgId,
      updates
    )

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    })
  } catch (error) {
    console.error('Update project error:', error)

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
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check delete permission
    const canDelete = await ProjectPermissionService.canDeleteProjects(session)
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to delete projects' },
        { status: 403 }
      )
    }

    const { id } = await params
    const project = await ProjectService.getProject(id, session.user.orgId)

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const success = await ProjectService.deleteProject(project._id.toString(), session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
