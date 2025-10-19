import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrganizationAssetSettingsService } from '@/lib/services/organization-asset-settings'

/**
 * GET /api/settings/asset-settings - Get organization asset settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await OrganizationAssetSettingsService.getOrCreateSettings(
      session.user.orgId,
      session.user.id
    )

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching asset settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/asset-settings - Update organization asset settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const settings = await OrganizationAssetSettingsService.updateSettings(
      session.user.orgId,
      body
    )

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error updating asset settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update asset settings' },
      { status: 400 }
    )
  }
}
