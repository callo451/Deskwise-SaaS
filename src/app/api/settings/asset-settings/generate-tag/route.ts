import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrganizationAssetSettingsService } from '@/lib/services/organization-asset-settings'

/**
 * POST /api/settings/asset-settings/generate-tag - Generate next asset tag
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { categoryCode } = body

    const assetTag = await OrganizationAssetSettingsService.generateNextAssetTag(
      session.user.orgId,
      categoryCode
    )

    return NextResponse.json({ assetTag })
  } catch (error) {
    console.error('Error generating asset tag:', error)
    return NextResponse.json(
      { error: 'Failed to generate asset tag' },
      { status: 500 }
    )
  }
}
