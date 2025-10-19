import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetService, type CreateAssetInput, type AssetFilters } from '@/lib/services/assets'
import { z } from 'zod'

const createAssetSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  name: z.string().min(1, 'Asset name is required'),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  location: z.string().optional(),
  purchaseCost: z.number().optional(),
  specifications: z.record(z.string()).optional(),
})

/**
 * GET /api/assets - List all assets with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Support both session-based and header-based auth (for testing)
    const session = await getServerSession(authOptions)
    const headerOrgId = request.headers.get('X-Org-Id')
    const orgId = session?.user?.orgId || headerOrgId

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: AssetFilters = {}

    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as any
    }
    if (searchParams.get('assignedTo')) {
      filters.assignedTo = searchParams.get('assignedTo')!
    }
    if (searchParams.get('clientId')) {
      filters.clientId = searchParams.get('clientId')!
    }
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location')!
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    const assets = await AssetService.getAssets(orgId, filters)

    return NextResponse.json({
      success: true,
      data: assets,
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/assets - Create a new asset
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createAssetSchema.parse(body)

    const input: CreateAssetInput = {
      assetTag: validated.assetTag,
      name: validated.name,
      category: validated.category,
      manufacturer: validated.manufacturer,
      model: validated.model,
      serialNumber: validated.serialNumber,
      purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
      warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : undefined,
      assignedTo: validated.assignedTo,
      clientId: validated.clientId,
      location: validated.location,
      purchaseCost: validated.purchaseCost,
      specifications: validated.specifications,
    }

    const asset = await AssetService.createAsset(
      session.user.orgId,
      input,
      session.user.id
    )

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

    console.error('Error creating asset:', error)
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
