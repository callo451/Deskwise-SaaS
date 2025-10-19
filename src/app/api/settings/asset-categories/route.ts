import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetCategoryService } from '@/lib/services/asset-categories'

/**
 * GET /api/settings/asset-categories - Get all asset categories for organization
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

    if (tree) {
      const categories = await AssetCategoryService.getCategoryTree(session.user.orgId)
      return NextResponse.json(categories)
    }

    const categories = await AssetCategoryService.getCategories(
      session.user.orgId,
      includeInactive
    )

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching asset categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/asset-categories - Create new asset category
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, icon, color, description, parentId, customFields } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    const category = await AssetCategoryService.createCategory(
      session.user.orgId,
      {
        name,
        code,
        icon,
        color,
        description,
        parentId,
        customFields,
      },
      session.user.id,
      false // Not a system category
    )

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error creating asset category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create asset category' },
      { status: 400 }
    )
  }
}
