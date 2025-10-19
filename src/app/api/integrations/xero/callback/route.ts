import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * GET /api/integrations/xero/callback
 * Handle OAuth callback from Xero
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=unauthorized', req.url)
      )
    }

    const orgId = session.user.orgId
    const userId = session.user.userId

    console.log('[Xero API] Handling OAuth callback for org:', orgId)

    // Get the full callback URL
    const callbackUrl = req.url

    // Exchange code for tokens
    const integration = await XeroIntegrationService.handleCallback(orgId, callbackUrl, userId)

    console.log('[Xero API] OAuth callback successful, integration ID:', integration._id)

    // Redirect to integrations page with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?xero=connected', req.url)
    )
  } catch (error: any) {
    console.error('[Xero API] OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/integrations?error=${encodeURIComponent(error.message || 'OAuth callback failed')}`,
        req.url
      )
    )
  }
}
