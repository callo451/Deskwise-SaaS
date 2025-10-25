import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { BrandingService } from '@/lib/services/branding'

/**
 * POST /api/branding/rollback
 * Rollback to a specific branding version (Admin only)
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

    const body = await request.json()
    const { version } = body

    if (!version || typeof version !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Version number is required' },
        { status: 400 }
      )
    }

    const userName = session.user.name || session.user.email || 'Unknown User'

    const rolledBackBranding = await BrandingService.rollbackToVersion(
      session.user.orgId,
      version,
      session.user.id,
      userName
    )

    return NextResponse.json({
      success: true,
      data: rolledBackBranding,
      message: `Branding rolled back to version ${version} successfully`,
    })
  } catch (error) {
    console.error('Rollback branding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rollback branding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
