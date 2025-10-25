import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { BrandingService } from '@/lib/services/branding'

/**
 * GET /api/branding
 * Get current branding configuration for the organization
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

    const branding = await BrandingService.getBranding(session.user.orgId)

    return NextResponse.json({
      success: true,
      data: branding,
    })
  } catch (error) {
    console.error('Get branding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch branding configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/branding
 * Update branding configuration (Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // RBAC check - need settings.edit permission
    const hasPermission = await requireAnyPermission(session, [
      'settings.edit',
      'settings.manage',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('settings.edit') },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { updates, changeDescription } = body

    if (!updates) {
      return NextResponse.json(
        { success: false, error: 'Updates object is required' },
        { status: 400 }
      )
    }

    // Validate color values if provided
    if (updates.colors) {
      for (const [key, value] of Object.entries(updates.colors)) {
        if (value) {
          const color = value as { h: number; s: number; l: number }
          if (
            color.h < 0 ||
            color.h > 360 ||
            color.s < 0 ||
            color.s > 100 ||
            color.l < 0 ||
            color.l > 100
          ) {
            return NextResponse.json(
              {
                success: false,
                error: `Invalid ${key} color values. H: 0-360, S: 0-100, L: 0-100`,
              },
              { status: 400 }
            )
          }
        }
      }
    }

    const userName = session.user.name || session.user.email || 'Unknown User'

    const updatedBranding = await BrandingService.updateBranding(
      session.user.orgId,
      updates,
      session.user.id,
      userName,
      changeDescription
    )

    return NextResponse.json({
      success: true,
      data: updatedBranding,
      message: 'Branding updated successfully',
    })
  } catch (error) {
    console.error('Update branding error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update branding',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
