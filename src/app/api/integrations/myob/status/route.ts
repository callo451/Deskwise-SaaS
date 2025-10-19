import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'

/**
 * GET /api/integrations/myob/status
 * Get MYOB integration status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    // Get integration
    const integration = await MYOBIntegrationService.getIntegration(orgId)

    if (!integration) {
      return NextResponse.json({
        success: true,
        connected: false,
        integration: null,
      })
    }

    // Remove sensitive data before sending to client
    const sanitizedIntegration = {
      status: integration.status,
      companyFileId: integration.companyFileId,
      companyFileName: integration.companyFileName,
      environment: integration.environment,
      syncSettings: integration.syncSettings,
      lastSyncAt: integration.lastSyncAt,
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncError: integration.lastSyncError,
      lastTestedAt: integration.lastTestedAt,
      lastTestResult: integration.lastTestResult,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }

    return NextResponse.json({
      success: true,
      connected: integration.status === 'connected',
      integration: sanitizedIntegration,
    })
  } catch (error: any) {
    console.error('Get MYOB status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get integration status' },
      { status: 500 }
    )
  }
}
