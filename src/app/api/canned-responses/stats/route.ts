import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { CannedResponseService } from '@/lib/services/canned-responses'

/**
 * GET /api/canned-responses/stats
 * Get canned response statistics
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

    const hasPermission = await requireAnyPermission(session, [
      'tickets.manage',
      'settings.view',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('settings.view') },
        { status: 403 }
      )
    }

    const stats = await CannedResponseService.getStats(session.user.orgId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
