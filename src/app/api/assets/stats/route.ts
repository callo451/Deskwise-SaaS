import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetService } from '@/lib/services/assets'

/**
 * GET /api/assets/stats - Get asset statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Support both session-based and header-based auth (for testing)
    const session = await getServerSession(authOptions)
    const headerOrgId = request.headers.get('X-Org-Id')
    const orgId = session?.user?.orgId || headerOrgId

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await AssetService.getAssetStats(orgId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching asset stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset statistics' },
      { status: 500 }
    )
  }
}
