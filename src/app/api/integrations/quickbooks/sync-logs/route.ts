import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksIntegrationService } from '@/lib/services/quickbooks-integration'

/**
 * GET /api/integrations/quickbooks/sync-logs
 * Get QuickBooks sync logs
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    const searchParams = req.nextUrl.searchParams
    const entityType = searchParams.get('entityType') as any
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')

    const logs = await QuickBooksIntegrationService.getSyncLogs(orgId, {
      entityType,
      status,
      limit,
    })

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    })
  } catch (error: any) {
    console.error('[QuickBooks API] Error fetching sync logs:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch sync logs',
      },
      { status: 500 }
    )
  }
}
