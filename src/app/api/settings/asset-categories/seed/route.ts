import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetCategoryService } from '@/lib/services/asset-categories'

/**
 * POST /api/settings/asset-categories/seed - Seed default categories
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await AssetCategoryService.seedDefaultCategories(
      session.user.orgId,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error seeding asset categories:', error)
    return NextResponse.json(
      { error: 'Failed to seed asset categories' },
      { status: 500 }
    )
  }
}
