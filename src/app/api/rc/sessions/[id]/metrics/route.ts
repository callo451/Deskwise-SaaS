import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RemoteControlService } from '@/lib/services/remote-control'
import { z } from 'zod'

const metricsSchema = z.object({
  avgFps: z.number().optional(),
  avgLatency: z.number().optional(),
  packetsLost: z.number().optional(),
  bandwidth: z.number().optional(),
})

/**
 * GET /api/rc/sessions/[id]/metrics
 * Get session quality metrics
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = session.user
    const { id } = await params
    const sessionId = id

    const rcSession = await RemoteControlService.getSession(sessionId, orgId)

    if (!rcSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: rcSession.qualityMetrics || {},
    })
  } catch (error) {
    console.error('Error fetching session metrics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rc/sessions/[id]/metrics
 * Update session quality metrics
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = session.user
    const { id } = await params
    const sessionId = id

    const body = await req.json()
    const validation = metricsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    await RemoteControlService.updateMetrics(sessionId, orgId, validation.data)

    return NextResponse.json({
      success: true,
      message: 'Metrics updated successfully',
    })
  } catch (error) {
    console.error('Error updating session metrics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update metrics' },
      { status: 500 }
    )
  }
}
