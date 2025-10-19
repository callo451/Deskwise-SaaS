import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksIntegrationService } from '@/lib/services/quickbooks-integration'

/**
 * POST /api/integrations/quickbooks/connect
 * Initiate QuickBooks OAuth flow
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[QuickBooks API] Initiating OAuth flow for org:', orgId)

    // Generate authorization URL
    const authUrl = await QuickBooksIntegrationService.getAuthorizationUrl(orgId)

    return NextResponse.json({
      success: true,
      authorizationUrl: authUrl,
    })
  } catch (error: any) {
    console.error('[QuickBooks API] Error initiating OAuth:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to initiate QuickBooks connection',
      },
      { status: 500 }
    )
  }
}
