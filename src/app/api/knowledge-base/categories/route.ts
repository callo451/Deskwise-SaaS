import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KBCategoryService } from '@/lib/services/kb-categories'
import { PermissionService } from '@/lib/services/permissions'

/**
 * GET /api/knowledge-base/categories
 * Get all KB categories for organization
 *
 * Query params:
 * - includeInactive: Include inactive categories (default: false)
 * - tree: Return hierarchical tree structure (default: false)
 * - userFiltered: Return only categories accessible by current user (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const tree = searchParams.get('tree') === 'true'
    const userFiltered = searchParams.get('userFiltered') === 'true'

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

    // Return categories filtered by user's access
    if (userFiltered) {
      const categories = await KBCategoryService.getCategoriesForUser(
        session.user.id,
        session.user.orgId,
        includeInactive
      )

      if (tree) {
        const treeData = KBCategoryService.buildCategoryTree(categories)
        return NextResponse.json(treeData)
      }

      return NextResponse.json(categories)
    }

    // Return all categories (requires manage permission)
    const canManage = await PermissionService.hasAnyPermission(
      session.user.id,
      session.user.orgId,
      ['settings.edit', 'kb.manage']
    )

    if (!canManage && !userFiltered) {
      // Non-managers can only see their accessible categories
      const categories = await KBCategoryService.getCategoriesForUser(
        session.user.id,
        session.user.orgId,
        includeInactive
      )

      if (tree) {
        const treeData = KBCategoryService.buildCategoryTree(categories)
        return NextResponse.json(treeData)
      }

      return NextResponse.json(categories)
    }

    // Return tree structure
    if (tree) {
      const categories = await KBCategoryService.getCategoryTree(session.user.orgId)
      return NextResponse.json(categories)
    }

    // Return flat list
    const categories = await KBCategoryService.getAllCategories(
      session.user.orgId,
      includeInactive
    )

    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error fetching KB categories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KB categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/knowledge-base/categories
 * Create new KB category
 *
 * Requires: settings.edit OR kb.manage permission
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission to manage KB categories
    const hasPermission = await PermissionService.hasAnyPermission(
      session.user.id,
      session.user.orgId,
      ['settings.edit', 'kb.manage']
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create KB categories' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      icon,
      color,
      parentId,
      order,
      isPublic,
      allowedRoles,
      allowedUsers,
      permissions,
    } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Create category
    const category = await KBCategoryService.createCategory(
      session.user.orgId,
      {
        name: name.trim(),
        description,
        icon,
        color,
        parentId,
        order,
        isPublic,
        allowedRoles,
        allowedUsers,
        permissions,
      },
      session.user.id
    )

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error creating KB category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create KB category' },
      { status: 400 }
    )
  }
}
