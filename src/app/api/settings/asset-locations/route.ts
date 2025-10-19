import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetLocationService } from '@/lib/services/asset-locations'

/**
 * GET /api/settings/asset-locations - Get all asset locations for organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const tree = searchParams.get('tree') === 'true'
    const type = searchParams.get('type') as any

    if (tree) {
      const locations = await AssetLocationService.getLocationTree(session.user.orgId)
      return NextResponse.json(locations)
    }

    if (type) {
      const locations = await AssetLocationService.getLocationsByType(
        session.user.orgId,
        type
      )
      return NextResponse.json(locations)
    }

    const locations = await AssetLocationService.getLocations(
      session.user.orgId,
      includeInactive
    )

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching asset locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset locations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/asset-locations - Create new asset location
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      code,
      type,
      parentId,
      address,
      coordinates,
      contactPerson,
      contactEmail,
      contactPhone,
      notes,
    } = body

    if (!name || !code || !type) {
      return NextResponse.json(
        { error: 'Name, code, and type are required' },
        { status: 400 }
      )
    }

    const location = await AssetLocationService.createLocation(
      session.user.orgId,
      {
        name,
        code,
        type,
        parentId,
        address,
        coordinates,
        contactPerson,
        contactEmail,
        contactPhone,
        notes,
      },
      session.user.id
    )

    return NextResponse.json(location, { status: 201 })
  } catch (error: any) {
    console.error('Error creating asset location:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create asset location' },
      { status: 400 }
    )
  }
}
