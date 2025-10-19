import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksIntegrationService } from '@/lib/services/quickbooks-integration'

/**
 * POST /api/integrations/quickbooks/disconnect
 * Disconnect QuickBooks integration and revoke tokens
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const userId = session.user.userId

    const body = await req.json()
    const { reason } = body

    console.log('[QuickBooks API] Disconnecting integration for org:', orgId)

    await QuickBooksIntegrationService.disconnect(orgId, userId, reason)

    return NextResponse.json({
      success: true,
      message: 'QuickBooks integration disconnected successfully',
    })
  } catch (error: any) {
    console.error('[QuickBooks API] Error disconnecting:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to disconnect QuickBooks integration',
      },
      { status: 500 }
    )
  }
}
