import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetLocationService } from '@/lib/services/asset-locations'

/**
 * GET /api/settings/asset-locations/[id] - Get single asset location
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const location = await AssetLocationService.getLocationById(id, session.user.orgId)

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching asset location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset location' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/asset-locations/[id] - Update asset location
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const location = await AssetLocationService.updateLocation(
      id,
      session.user.orgId,
      body
    )

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error: any) {
    console.error('Error updating asset location:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update asset location' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/settings/asset-locations/[id] - Delete asset location
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const success = await AssetLocationService.deleteLocation(id, session.user.orgId)

    if (!success) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting asset location:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete asset location' },
      { status: 400 }
    )
  }
}
