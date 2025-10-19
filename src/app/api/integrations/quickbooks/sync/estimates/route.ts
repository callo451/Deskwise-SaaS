import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksSyncService } from '@/lib/services/quickbooks-sync'

/**
 * POST /api/integrations/quickbooks/sync/estimates
 * Sync quote(s) to QuickBooks as estimates
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

    const idsToSync = quoteIds || (quoteId ? [quoteId] : [])

    if (idsToSync.length === 0) {
      return NextResponse.json(
        { error: 'No quote IDs provided' },
        { status: 400 }
      )
    }

    console.log('[QuickBooks API] Syncing quotes as estimates:', idsToSync)

    const results = await Promise.all(
      idsToSync.map(async (id: string) => {
        const result = await QuickBooksSyncService.syncEstimate(orgId, id, userId)
        return {
          quoteId: id,
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
    console.error('[QuickBooks API] Error syncing estimates:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync estimates',
      },
      { status: 500 }
    )
  }
}
