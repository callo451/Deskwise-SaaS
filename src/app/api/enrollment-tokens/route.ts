import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EnrollmentTokenService } from '@/lib/services/enrollment-tokens'

/**
 * GET /api/enrollment-tokens - List enrollment tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'pending' | 'used' | 'expired' | 'revoked' | null
    const assetId = searchParams.get('assetId')

    const filters: any = {}
    if (status) filters.status = status
    if (assetId) filters.assetId = assetId

    const tokens = await EnrollmentTokenService.listTokens(session.user.orgId, filters)

    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Error fetching enrollment tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollment tokens' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/enrollment-tokens - Generate new enrollment token
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assetId, expiresInHours = 24, notes } = body

    // Asset ID is now optional - agent will auto-create if not provided
    const token = await EnrollmentTokenService.generateToken(
      session.user.orgId,
      session.user.id,
      {
        assetId,
        expiresInHours,
        notes
      }
    )

    return NextResponse.json(token, { status: 201 })
  } catch (error) {
    console.error('Error generating enrollment token:', error)
    return NextResponse.json(
      { error: 'Failed to generate enrollment token' },
      { status: 500 }
    )
  }
}
