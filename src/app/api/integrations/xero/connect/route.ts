import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/connect
 * Initiate Xero OAuth flow
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[Xero API] Initiating OAuth flow for org:', orgId)

    // Generate authorization URL
    const authUrl = await XeroIntegrationService.getAuthorizationUrl(orgId)

    return NextResponse.json({
      success: true,
      authorizationUrl: authUrl,
    })
  } catch (error: any) {
    console.error('[Xero API] Error initiating OAuth:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to initiate Xero connection',
      },
      { status: 500 }
    )
  }
}
