import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RemoteControlService } from '@/lib/services/remote-control'
import { z } from 'zod'

const consentSchema = z.object({
  granted: z.boolean(),
})

/**
 * POST /api/rc/sessions/[id]/consent
 * Grant or deny consent for a remote control session
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

    const { orgId, userId } = session.user
    const { id } = await params
    const sessionId = id

    const body = await req.json()
    const validation = consentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { granted } = validation.data

    if (granted) {
      const updatedSession = await RemoteControlService.grantConsent(sessionId, orgId, userId)
      return NextResponse.json({
        success: true,
        data: updatedSession,
        message: 'Consent granted successfully',
      })
    } else {
      await RemoteControlService.denyConsent(sessionId, orgId, userId)
      return NextResponse.json({
        success: true,
        message: 'Consent denied',
      })
    }
  } catch (error) {
    console.error('Error processing consent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process consent' },
      { status: 500 }
    )
  }
}
