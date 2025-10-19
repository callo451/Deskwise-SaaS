import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksIntegrationService } from '@/lib/services/quickbooks-integration'

/**
 * GET /api/integrations/quickbooks/status
 * Get QuickBooks integration status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)

    if (!integration) {
      return NextResponse.json({
        connected: false,
        integration: null,
      })
    }

    // Return sanitized integration data (without tokens)
    const sanitizedIntegration = {
      _id: integration._id,
      orgId: integration.orgId,
      status: integration.status,
      realmId: integration.realmId,
      companyName: integration.companyName,
      country: integration.country,
      environment: integration.environment,
      autoSync: integration.autoSync,
      syncDirection: integration.syncDirection,
      syncFrequency: integration.syncFrequency,
      lastSyncAt: integration.lastSyncAt,
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncError: integration.lastSyncError,
      totalInvoicesSynced: integration.totalInvoicesSynced,
      totalCustomersSynced: integration.totalCustomersSynced,
      totalProductsSynced: integration.totalProductsSynced,
      totalPaymentsSynced: integration.totalPaymentsSynced,
      lastHealthCheckAt: integration.lastHealthCheckAt,
      lastHealthCheckStatus: integration.lastHealthCheckStatus,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }

    return NextResponse.json({
      connected: integration.status === 'connected',
      integration: sanitizedIntegration,
    })
  } catch (error: any) {
    console.error('[QuickBooks API] Error getting status:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to get integration status',
      },
      { status: 500 }
    )
  }
}
