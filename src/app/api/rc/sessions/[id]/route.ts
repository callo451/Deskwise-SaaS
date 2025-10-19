import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RemoteControlService } from '@/lib/services/remote-control'

/**
 * GET /api/rc/sessions/[id]
 * Get a specific remote control session
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
      data: rcSession,
    })
  } catch (error) {
    console.error('Error fetching remote control session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rc/sessions/[id]
 * End a remote control session
 */
export async function DELETE(
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

    const updatedSession = await RemoteControlService.updateSessionStatus(
      sessionId,
      orgId,
      'ended'
    )

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: 'Session ended successfully',
    })
  } catch (error) {
    console.error('Error ending remote control session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end session' },
      { status: 500 }
    )
  }
}
