import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/sync/quotes
 * Sync quote(s) to Xero
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
    const { quoteId, quoteIds } = body

    if (!quoteId && (!quoteIds || quoteIds.length === 0)) {
      return NextResponse.json(
        { error: 'quoteId or quoteIds is required' },
        { status: 400 }
      )
    }

    console.log('[Xero API] Syncing quotes for org:', orgId)

    // Handle single quote
    if (quoteId) {
      const result = await XeroIntegrationService.syncQuote(orgId, quoteId, userId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          xeroQuoteId: result.xeroQuoteId,
          message: 'Quote synced successfully',
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to sync quote',
          },
          { status: 400 }
        )
      }
    }

    // Handle multiple quotes
    if (quoteIds && quoteIds.length > 0) {
      const results = await Promise.all(
        quoteIds.map((id: string) =>
          XeroIntegrationService.syncQuote(orgId, id, userId)
        )
      )

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      return NextResponse.json({
        success: true,
        message: `Synced ${successful} quote(s), ${failed} failed`,
        results: results.map((r, idx) => ({
          quoteId: quoteIds[idx],
          success: r.success,
          xeroQuoteId: r.xeroQuoteId,
          error: r.error,
        })),
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Xero API] Quote sync error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync quotes',
      },
      { status: 500 }
    )
  }
}
