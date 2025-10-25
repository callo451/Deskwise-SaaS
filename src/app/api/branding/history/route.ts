import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BrandingService } from '@/lib/services/branding'

/**
 * GET /api/branding/history
 * Get branding version history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20

    const history = await BrandingService.getBrandingHistory(
      session.user.orgId,
      limit
    )

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error('Get branding history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch branding history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
