import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KBCategoryService } from '@/lib/services/kb-categories'
import { PermissionService } from '@/lib/services/permissions'

/**
 * GET /api/knowledge-base/categories/tree
 * Get hierarchical category tree structure
 *
 * This is a convenience endpoint that's equivalent to:
 * GET /api/knowledge-base/categories?tree=true
 *
 * Returns categories in a nested tree structure with children.
 * Useful for rendering hierarchical navigation menus and category selectors.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view KB
    const hasPermission = await PermissionService.hasPermission(
      session.user.id,
      session.user.orgId,
      'kb.view'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view knowledge base' },
        { status: 403 }
      )
    }

    // Check if user can manage categories (see all) or only their accessible ones
    const canManage = await PermissionService.hasAnyPermission(
      session.user.id,
      session.user.orgId,
      ['settings.edit', 'kb.manage']
    )

    let tree

    if (canManage) {
      // Return full tree for managers
      tree = await KBCategoryService.getCategoryTree(session.user.orgId)
    } else {
      // Return filtered tree for regular users (only categories they can access)
      const categories = await KBCategoryService.getCategoriesForUser(
        session.user.id,
        session.user.orgId,
        false
      )
      tree = KBCategoryService.buildCategoryTree(categories)
    }

    return NextResponse.json(tree)
  } catch (error: any) {
    console.error('Error fetching KB category tree:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KB category tree' },
      { status: 500 }
    )
  }
}
