import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetService, type UpdateAssetInput } from '@/lib/services/assets'
import { z } from 'zod'

const updateAssetSchema = z.object({
  assetTag: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'retired', 'disposed']).optional(),
  purchaseCost: z.number().optional(),
  specifications: z.record(z.string()).optional(),
  maintenanceSchedule: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
})

/**
 * GET /api/assets/[id] - Get single asset by ID
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

    const asset = await AssetService.getAssetById(id, session.user.orgId)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: asset,
    })
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/assets/[id] - Update an asset
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
    const validated = updateAssetSchema.parse(body)

    const updates: UpdateAssetInput = {
      ...validated,
      purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
      warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : undefined,
      lastMaintenanceDate: validated.lastMaintenanceDate
        ? new Date(validated.lastMaintenanceDate)
        : undefined,
    }

    const asset = await AssetService.updateAsset(id, session.user.orgId, updates)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: asset,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating asset:', error)
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/assets/[id] - Delete (soft delete) an asset
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

    const success = await AssetService.deleteAsset(id, session.user.orgId)

    if (!success) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
