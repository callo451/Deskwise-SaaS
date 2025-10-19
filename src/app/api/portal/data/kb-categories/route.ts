import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

/**
 * GET /api/portal/data/kb-categories
 * Get KB categories for portal block selection
 * Returns simplified data optimized for dropdowns
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('deskwise')

    // Fetch active KB categories
    const categories = await db
      .collection('kb_categories')
      .find({
        orgId: session.user.orgId,
        isActive: true,
      })
      .project({
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        icon: 1,
        color: 1,
        parentId: 1,
        fullPath: 1,
        isPublic: 1,
        articleCount: 1,
      })
      .sort({ order: 1, name: 1 })
      .toArray()

    // Transform to dropdown-friendly format
    const simplified = categories.map(category => ({
      value: category._id.toString(),
      label: category.fullPath || category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isPublic: category.isPublic,
      articleCount: category.articleCount || 0,
      parentId: category.parentId?.toString(),
    }))

    return NextResponse.json(simplified)
  } catch (error: any) {
    console.error('Error fetching KB categories for portal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
