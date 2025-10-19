import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProblemService } from '@/lib/services/problems'
import { z } from 'zod'

const updateProblemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  status: z.enum(['open', 'investigating', 'known_error', 'resolved', 'closed']).optional(),
  impact: z.enum(['low', 'medium', 'high']).optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  affectedServices: z.array(z.string()).optional(),
  clientIds: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  assignedTo: z.string().optional(),
  rootCause: z.string().optional(),
  workaround: z.string().optional(),
  solution: z.string().optional(),
  resolvedAt: z.string().optional(),
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
    const problem = await ProblemService.getProblemById(id, session.user.orgId)

    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: problem,
    })
  } catch (error) {
    console.error('Get problem error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problem' },
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
    const body = await request.json()
    const validatedData = updateProblemSchema.parse(body)

    // Convert resolvedAt string to Date if provided
    const updates: any = { ...validatedData }
    if (updates.resolvedAt) {
      updates.resolvedAt = new Date(updates.resolvedAt)
    }

    const problem = await ProblemService.updateProblem(
      id,
      session.user.orgId,
      updates,
      session.user.id
    )

    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: problem,
      message: 'Problem updated successfully',
    })
  } catch (error) {
    console.error('Update problem error:', error)

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
      { success: false, error: 'Failed to update problem' },
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

    const { id } = await params
    const success = await ProblemService.deleteProblem(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Problem deleted successfully',
    })
  } catch (error) {
    console.error('Delete problem error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete problem' },
      { status: 500 }
    )
  }
}
