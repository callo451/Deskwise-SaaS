import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'

/**
 * GET /api/integrations/myob/connect
 * Initiate OAuth flow - redirects to MYOB authorization page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    // Generate MYOB OAuth URL
    const authUrl = MYOBIntegrationService.getAuthorizationUrl(orgId)

    // Return the URL for client-side redirect
    return NextResponse.json({
      success: true,
      authUrl,
    })
  } catch (error: any) {
    console.error('MYOB connect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate MYOB connection' },
      { status: 500 }
    )
  }
}
