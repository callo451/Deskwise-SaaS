import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksSyncService } from '@/lib/services/quickbooks-sync'

/**
 * POST /api/integrations/quickbooks/sync/customers
 * Sync client(s) to QuickBooks as customers
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

    const idsToSync = clientIds || (clientId ? [clientId] : [])

    if (idsToSync.length === 0) {
      return NextResponse.json(
        { error: 'No client IDs provided' },
        { status: 400 }
      )
    }

    console.log('[QuickBooks API] Syncing clients as customers:', idsToSync)

    const results = await Promise.all(
      idsToSync.map(async (id: string) => {
        const result = await QuickBooksSyncService.syncCustomer(orgId, id, userId)
        return {
          clientId: id,
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
    console.error('[QuickBooks API] Error syncing customers:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync customers',
      },
      { status: 500 }
    )
  }
}
