import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksIntegrationService } from '@/lib/services/quickbooks-integration'

/**
 * GET /api/integrations/quickbooks/callback
 * OAuth callback handler
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const userId = session.user.userId

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const realmId = searchParams.get('realmId')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('[QuickBooks API] OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/integrations?error=${encodeURIComponent(errorDescription || error)}`,
          req.url
        )
      )
    }

    // Validate required parameters
    if (!code || !state || !realmId) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/integrations?error=Invalid callback parameters',
          req.url
        )
      )
    }

    console.log('[QuickBooks API] Processing OAuth callback for org:', orgId)

    // Exchange code for tokens
    const integration = await QuickBooksIntegrationService.exchangeCodeForTokens(
      orgId,
      code,
      state,
      realmId,
      userId
    )

    console.log('[QuickBooks API] Successfully connected to QuickBooks')

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=quickbooks_connected', req.url)
    )
  } catch (error: any) {
    console.error('[QuickBooks API] Error in OAuth callback:', error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/integrations?error=${encodeURIComponent(error.message)}`,
        req.url
      )
    )
  }
}
