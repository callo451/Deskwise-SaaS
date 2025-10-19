import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'

/**
 * GET /api/integrations/myob/callback
 * OAuth callback handler - exchanges code for tokens
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('MYOB OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/integrations/myob?error=${encodeURIComponent(errorDescription || error)}`,
          req.url
        )
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations/myob?error=No authorization code received', req.url)
      )
    }

    // Verify state matches orgId
    if (state !== session.user.orgId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations/myob?error=Invalid state parameter', req.url)
      )
    }

    // Exchange code for tokens and save integration
    await MYOBIntegrationService.saveIntegration(
      session.user.orgId,
      { code },
      session.user.userId
    )

    // Redirect to integration settings with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations/myob?success=connected', req.url)
    )
  } catch (error: any) {
    console.error('MYOB callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/integrations/myob?error=${encodeURIComponent(error.message || 'Failed to complete connection')}`,
        req.url
      )
    )
  }
}
