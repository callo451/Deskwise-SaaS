import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecorderService } from '@/lib/services/recorder'
import { z } from 'zod'

const updateStepSchema = z.object({
  description: z.string().optional(),
  selector: z.string().optional(),
  value: z.string().optional(),
  screenshotId: z.string().optional(),
})

/**
 * PUT /api/knowledge-base/recorder/steps/[id]
 * Update a recording step
 */
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
    const validatedData = updateStepSchema.parse(body)

    const step = await RecorderService.updateStep(
      id,
      session.user.orgId,
      validatedData
    )

    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: step,
      message: 'Step updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating step:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/knowledge-base/recorder/steps/[id]?sessionId=xxx
 * Delete a recording step
 */
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
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId query parameter is required' },
        { status: 400 }
      )
    }

    const deleted = await RecorderService.deleteStep(
      id,
      session.user.orgId,
      sessionId
    )

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Step deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting step:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
