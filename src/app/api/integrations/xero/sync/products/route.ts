import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/sync/products
 * Sync product(s) to Xero
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
    const { productId, productIds } = body

    if (!productId && (!productIds || productIds.length === 0)) {
      return NextResponse.json(
        { error: 'productId or productIds is required' },
        { status: 400 }
      )
    }

    console.log('[Xero API] Syncing products for org:', orgId)

    // Handle single product
    if (productId) {
      const result = await XeroIntegrationService.syncProduct(orgId, productId, userId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          xeroItemId: result.xeroItemId,
          message: 'Product synced successfully',
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to sync product',
          },
          { status: 400 }
        )
      }
    }

    // Handle multiple products
    if (productIds && productIds.length > 0) {
      const results = await Promise.all(
        productIds.map((id: string) =>
          XeroIntegrationService.syncProduct(orgId, id, userId)
        )
      )

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      return NextResponse.json({
        success: true,
        message: `Synced ${successful} product(s), ${failed} failed`,
        results: results.map((r, idx) => ({
          productId: productIds[idx],
          success: r.success,
          xeroItemId: r.xeroItemId,
          error: r.error,
        })),
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Xero API] Product sync error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync products',
      },
      { status: 500 }
    )
  }
}
