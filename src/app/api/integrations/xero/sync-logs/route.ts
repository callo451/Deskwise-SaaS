import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * GET /api/integrations/xero/sync-logs
 * Get Xero sync logs
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    // Get limit from query params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    console.log('[Xero API] Fetching sync logs for org:', orgId)

    const logs = await XeroIntegrationService.getSyncLogs(orgId, limit)

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    })
  } catch (error: any) {
    console.error('[Xero API] Error fetching sync logs:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch sync logs',
      },
      { status: 500 }
    )
  }
}
