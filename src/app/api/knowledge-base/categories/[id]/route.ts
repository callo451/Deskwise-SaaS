import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KBCategoryService } from '@/lib/services/kb-categories'
import { PermissionService } from '@/lib/services/permissions'

/**
 * GET /api/knowledge-base/categories/[id]
 * Get single KB category by ID with stats
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

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

    // Get category
    const category = await KBCategoryService.getCategoryById(id, session.user.orgId)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this specific category
    const hasAccess = await KBCategoryService.checkCategoryPermission(
      id,
      session.user.id,
      session.user.orgId,
      'view'
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this category' },
        { status: 403 }
      )
    }

    // Get category path for breadcrumbs
    const path = await KBCategoryService.getCategoryPath(id, session.user.orgId)

    return NextResponse.json({
      category,
      path,
    })
  } catch (error: any) {
    console.error('Error fetching KB category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KB category' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/knowledge-base/categories/[id]
 * Update KB category
 *
 * Requires: settings.edit OR kb.manage permission
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check permission to manage KB categories
    const hasPermission = await PermissionService.hasAnyPermission(
      session.user.id,
      session.user.orgId,
      ['settings.edit', 'kb.manage']
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update KB categories' },
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
      isActive,
      isPublic,
      allowedRoles,
      allowedUsers,
      permissions,
    } = body

    // Validate name if provided
    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name cannot be empty' },
        { status: 400 }
      )
    }

    // Update category
    const category = await KBCategoryService.updateCategory(
      id,
      session.user.orgId,
      {
        name: name?.trim(),
        description,
        icon,
        color,
        parentId,
        order,
        isActive,
        isPublic,
        allowedRoles,
        allowedUsers,
        permissions,
      }
    )

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating KB category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update KB category' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/knowledge-base/categories/[id]
 * Delete KB category (soft delete)
 *
 * Requires: settings.edit OR kb.manage permission
 * Will fail if articles exist in the category
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check permission to manage KB categories
    const hasPermission = await PermissionService.hasAnyPermission(
      session.user.id,
      session.user.orgId,
      ['settings.edit', 'kb.manage']
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete KB categories' },
        { status: 403 }
      )
    }

    // Delete category (will throw error if articles exist)
    const success = await KBCategoryService.deleteCategory(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting KB category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete KB category' },
      { status: 400 }
    )
  }
}
