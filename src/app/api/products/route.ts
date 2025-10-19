import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProductService } from '@/lib/services/products'
import { ProductCategory, ProductType } from '@/lib/types'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if org is MSP mode
  if ((session.user as any).orgMode !== 'msp') {
    return NextResponse.json(
      { error: 'Feature only available for MSP organizations' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      category: searchParams.get('category') as ProductCategory | undefined,
      type: searchParams.get('type') as ProductType | undefined,
      isActive:
        searchParams.get('isActive') === null
          ? undefined
          : searchParams.get('isActive') === 'true',
      search: searchParams.get('search') || undefined,
      includeArchived: searchParams.get('includeArchived') === 'true',
    }

    const products = await ProductService.getProducts(
      session.user.orgId,
      filters
    )

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId || !session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if org is MSP mode
  if ((session.user as any).orgMode !== 'msp') {
    return NextResponse.json(
      { error: 'Feature only available for MSP organizations' },
      { status: 403 }
    )
  }

  try {
    const data = await request.json()

    // Validate required fields
    if (!data.sku || !data.name || !data.category || !data.type || !data.unitPrice || !data.unitOfMeasure) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await ProductService.createProduct(
      session.user.orgId,
      data,
      session.user.userId
    )

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
