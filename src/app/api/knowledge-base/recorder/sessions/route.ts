import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecorderService } from '@/lib/services/recorder'
import { z } from 'zod'

// Validation schema for creating a session
const createSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  url: z.string().url('Valid URL is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

/**
 * POST /api/knowledge-base/recorder/sessions
 * Create a new recording session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    const recordingSession = await RecorderService.createSession(
      session.user.orgId,
      session.user.id,
      validatedData
    )

    return NextResponse.json({
      success: true,
      data: recordingSession,
      message: 'Recording session created successfully',
    })
  } catch (error: any) {
    console.error('Error creating recording session:', error)

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
 * GET /api/knowledge-base/recorder/sessions
 * List recording sessions
 * Query params: ?userId=xxx&status=recording
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
    const userId = searchParams.get('userId') || undefined
    const status = searchParams.get('status') as any || undefined

    const sessions = await RecorderService.listSessions(
      session.user.orgId,
      userId,
      status
    )

    return NextResponse.json({
      success: true,
      data: sessions,
    })
  } catch (error: any) {
    console.error('Error listing recording sessions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
