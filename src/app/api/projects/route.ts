import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  clientId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().optional(),
  tags: z.array(z.string()),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      projectManager: searchParams.get('projectManager') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const projects = await ProjectService.getProjects(
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const project = await ProjectService.createProject(
      session.user.orgId,
      {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully',
    })
  } catch (error) {
    console.error('Create project error:', error)

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
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
