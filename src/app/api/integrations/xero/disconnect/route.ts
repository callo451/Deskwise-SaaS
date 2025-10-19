import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/disconnect
 * Disconnect Xero integration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const userId = session.user.userId

    console.log('[Xero API] Disconnecting integration for org:', orgId)

    await XeroIntegrationService.disconnect(orgId, userId)

    return NextResponse.json({
      success: true,
      message: 'Xero integration disconnected successfully',
    })
  } catch (error: any) {
    console.error('[Xero API] Error disconnecting:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to disconnect Xero integration',
      },
      { status: 500 }
    )
  }
}
