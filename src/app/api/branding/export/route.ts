import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { BrandingService } from '@/lib/services/branding'

/**
 * GET /api/branding/export
 * Export branding configuration as JSON
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

    // RBAC check - need settings.view permission
    const hasPermission = await requireAnyPermission(session, [
      'settings.view',
      'settings.edit',
      'settings.manage',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('settings.view') },
        { status: 403 }
      )
    }

    const exportData = await BrandingService.exportBranding(session.user.orgId)

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="branding-${session.user.orgId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Export branding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export branding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
