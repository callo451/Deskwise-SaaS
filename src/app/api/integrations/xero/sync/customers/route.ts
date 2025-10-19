import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/sync/customers
 * Sync customer(s) to Xero
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
    const { clientId, clientIds } = body

    if (!clientId && (!clientIds || clientIds.length === 0)) {
      return NextResponse.json(
        { error: 'clientId or clientIds is required' },
        { status: 400 }
      )
    }

    console.log('[Xero API] Syncing customers for org:', orgId)

    // Handle single customer
    if (clientId) {
      const result = await XeroIntegrationService.syncCustomer(orgId, clientId, userId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          xeroContactId: result.xeroContactId,
          message: 'Customer synced successfully',
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to sync customer',
          },
          { status: 400 }
        )
      }
    }

    // Handle multiple customers
    if (clientIds && clientIds.length > 0) {
      const results = await Promise.all(
        clientIds.map((id: string) =>
          XeroIntegrationService.syncCustomer(orgId, id, userId)
        )
      )

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      return NextResponse.json({
        success: true,
        message: `Synced ${successful} customer(s), ${failed} failed`,
        results: results.map((r, idx) => ({
          clientId: clientIds[idx],
          success: r.success,
          xeroContactId: r.xeroContactId,
          error: r.error,
        })),
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Xero API] Customer sync error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync customers',
      },
      { status: 500 }
    )
  }
}
