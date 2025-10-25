import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BrandingService } from '@/lib/services/branding'

/**
 * POST /api/branding/validate-subdomain
 * Validate subdomain availability
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subdomain } = body

    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Subdomain is required' },
        { status: 400 }
      )
    }

    const validation = await BrandingService.validateSubdomain(
      subdomain,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: validation,
    })
  } catch (error) {
    console.error('Validate subdomain error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate subdomain',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
