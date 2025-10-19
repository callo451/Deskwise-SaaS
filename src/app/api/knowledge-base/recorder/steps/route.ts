import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecorderService } from '@/lib/services/recorder'
import { z } from 'zod'

const createStepSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  stepNumber: z.number().int().positive(),
  action: z.enum(['click', 'type', 'navigate', 'scroll', 'select', 'hover']),
  description: z.string().min(1, 'Description is required'),
  selector: z.string().optional(),
  value: z.string().optional(),
  element: z.any().optional(),
  viewport: z.any().optional(),
  coordinates: z.any().optional(),
  screenshotId: z.string().optional(),
  timestamp: z.number(),
  url: z.string().optional(),
})

/**
 * POST /api/knowledge-base/recorder/steps
 * Add a step to a recording session
 */
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
    const validatedData = createStepSchema.parse(body)

    const step = await RecorderService.addStep(
      validatedData.sessionId,
      session.user.orgId,
      validatedData
    )

    return NextResponse.json({
      success: true,
      data: step,
      message: 'Step added successfully',
    })
  } catch (error: any) {
    console.error('Error adding step:', error)

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
 * GET /api/knowledge-base/recorder/steps?sessionId=xxx
 * Get all steps for a session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId query parameter is required' },
        { status: 400 }
      )
    }

    const steps = await RecorderService.getSteps(
      sessionId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: steps,
    })
  } catch (error: any) {
    console.error('Error fetching steps:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
