import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RemoteControlService } from '@/lib/services/remote-control'
import { z } from 'zod'

const createSessionSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
})

/**
 * POST /api/rc/sessions
 * Create a new remote control session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId, userId, role, name } = session.user

    // Check permission (creates default policy if none exists)
    const hasPermission = await RemoteControlService.checkPermission(orgId, role, userId)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to use remote control' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = createSessionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { assetId } = validation.data

    // Get client info
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    // Create session
    const { session: rcSession, token } = await RemoteControlService.createSession(orgId, {
      assetId,
      operatorUserId: userId,
      operatorName: name || 'Unknown',
      ipAddress,
      userAgent,
    })

    // Get ICE servers
    const iceServers = RemoteControlService.getICEServers()

    return NextResponse.json({
      success: true,
      data: {
        session: rcSession,
        token,
        iceServers,
      },
    })
  } catch (error) {
    console.error('Error creating remote control session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rc/sessions
 * Get all remote control sessions (with optional filters)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = session.user
    const { searchParams } = new URL(req.url)

    const filters = {
      assetId: searchParams.get('assetId') || undefined,
      operatorUserId: searchParams.get('operatorUserId') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
    }

    const sessions = await RemoteControlService.getSessions(orgId, filters)

    return NextResponse.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    console.error('Error fetching remote control sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
