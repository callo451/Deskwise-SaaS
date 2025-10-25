import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { BrandingService } from '@/lib/services/branding'

/**
 * POST /api/branding/import
 * Import branding configuration from JSON (Admin only)
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
    const { branding } = body

    if (!branding) {
      return NextResponse.json(
        { success: false, error: 'Branding data is required' },
        { status: 400 }
      )
    }

    // Basic validation
    if (
      !branding.logos ||
      !branding.colors ||
      !branding.typography ||
      !branding.identity ||
      !branding.email
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid branding data structure' },
        { status: 400 }
      )
    }

    const userName = session.user.name || session.user.email || 'Unknown User'

    const importedBranding = await BrandingService.importBranding(
      session.user.orgId,
      branding,
      session.user.id,
      userName
    )

    return NextResponse.json({
      success: true,
      data: importedBranding,
      message: 'Branding imported successfully',
    })
  } catch (error) {
    console.error('Import branding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import branding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
