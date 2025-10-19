import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksSyncService } from '@/lib/services/quickbooks-sync'

/**
 * POST /api/integrations/quickbooks/sync/items
 * Sync product(s) to QuickBooks as items
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

    const idsToSync = productIds || (productId ? [productId] : [])

    if (idsToSync.length === 0) {
      return NextResponse.json(
        { error: 'No product IDs provided' },
        { status: 400 }
      )
    }

    console.log('[QuickBooks API] Syncing products as items:', idsToSync)

    const results = await Promise.all(
      idsToSync.map(async (id: string) => {
        const result = await QuickBooksSyncService.syncItem(orgId, id, userId)
        return {
          productId: id,
          ...result,
        }
      })
    )

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: failureCount === 0,
      results,
      summary: {
        total: idsToSync.length,
        succeeded: successCount,
        failed: failureCount,
      },
    })
  } catch (error: any) {
    console.error('[QuickBooks API] Error syncing items:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync items',
      },
      { status: 500 }
    )
  }
}
