import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProblemService } from '@/lib/services/problems'
import { z } from 'zod'

const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().min(1, 'Category is required'),
  impact: z.enum(['low', 'medium', 'high']),
  urgency: z.enum(['low', 'medium', 'high']),
  affectedServices: z.array(z.string()),
  clientIds: z.array(z.string()),
  isPublic: z.boolean(),
  assignedTo: z.string().optional(),
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
      priority: searchParams.get('priority') || undefined,
      impact: searchParams.get('impact') || undefined,
      category: searchParams.get('category') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      isPublic: searchParams.get('isPublic')
        ? searchParams.get('isPublic') === 'true'
        : undefined,
      search: searchParams.get('search') || undefined,
    }

    const problems = await ProblemService.getProblems(
      session.user.orgId,
      filters as any
    )

    return NextResponse.json({
      success: true,
      data: problems,
    })
  } catch (error) {
    console.error('Get problems error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problems' },
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
    const validatedData = createProblemSchema.parse(body)

    const problem = await ProblemService.createProblem(
      session.user.orgId,
      validatedData,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: problem,
      message: 'Problem created successfully',
    })
  } catch (error) {
    console.error('Create problem error:', error)

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
      { success: false, error: 'Failed to create problem' },
      { status: 500 }
    )
  }
}
