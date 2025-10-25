import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { BrandingService } from '@/lib/services/branding'

/**
 * POST /api/branding/reset
 * Reset branding to default Deskwise theme (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // RBAC check - need settings.manage permission
    const hasPermission = await requireAnyPermission(session, [
      'settings.manage',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('settings.manage') },
        { status: 403 }
      )
    }

    const userName = session.user.name || session.user.email || 'Unknown User'

    const resetBranding = await BrandingService.resetBranding(
      session.user.orgId,
      session.user.id,
      userName
    )

    return NextResponse.json({
      success: true,
      data: resetBranding,
      message: 'Branding reset to default successfully',
    })
  } catch (error) {
    console.error('Reset branding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset branding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
