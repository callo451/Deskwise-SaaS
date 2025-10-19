import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * GET /api/integrations/xero/status
 * Get Xero integration status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[Xero API] Fetching integration status for org:', orgId)

    const integration = await XeroIntegrationService.getIntegration(orgId)

    if (!integration) {
      return NextResponse.json({
        connected: false,
        integration: null,
      })
    }

    // Return integration status without sensitive data
    return NextResponse.json({
      connected: true,
      integration: {
        _id: integration._id,
        status: integration.status,
        tenantId: integration.tenantId,
        tenantName: integration.tenantName,
        organizationName: integration.organizationName,
        countryCode: integration.countryCode,
        baseCurrency: integration.baseCurrency,
        autoSync: integration.autoSync,
        syncDirection: integration.syncDirection,
        syncFrequency: integration.syncFrequency,
        syncInvoices: integration.syncInvoices,
        syncQuotes: integration.syncQuotes,
        syncContacts: integration.syncContacts,
        syncProducts: integration.syncProducts,
        syncPayments: integration.syncPayments,
        lastSyncAt: integration.lastSyncAt,
        lastSyncStatus: integration.lastSyncStatus,
        lastHealthCheck: integration.lastHealthCheck,
        consecutiveFailures: integration.consecutiveFailures,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('[Xero API] Error fetching status:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch Xero integration status',
      },
      { status: 500 }
    )
  }
}
