import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetCategoryService } from '@/lib/services/asset-categories'

/**
 * GET /api/settings/asset-categories/[id] - Get single asset category
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

    const category = await AssetCategoryService.getCategoryById(id, session.user.orgId)

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching asset category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset category' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/asset-categories/[id] - Update asset category
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

    const category = await AssetCategoryService.updateCategory(
      id,
      session.user.orgId,
      body
    )

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating asset category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update asset category' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/settings/asset-categories/[id] - Delete asset category
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

    const success = await AssetCategoryService.deleteCategory(id, session.user.orgId)

    if (!success) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting asset category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete asset category' },
      { status: 400 }
    )
  }
}
