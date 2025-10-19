import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { KBCategory } from '../types'
import { PermissionService } from './permissions'

/**
 * Input type for creating a KB category
 */
export interface CreateKBCategoryInput {
  name: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  order?: number
  isPublic?: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
  permissions?: {
    view?: string[]
    contribute?: string[]
    manage?: string[]
  }
}

/**
 * Input type for updating a KB category
 */
export interface UpdateKBCategoryInput {
  name?: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  order?: number
  isActive?: boolean
  isPublic?: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
  permissions?: {
    view?: string[]
    contribute?: string[]
    manage?: string[]
  }
}

/**
 * Tree node structure for hierarchical categories
 */
export interface KBCategoryTreeNode extends KBCategory {
  children: KBCategoryTreeNode[]
  level: number
}

/**
 * KBCategoryService
 *
 * Manages knowledge base categories with hierarchical structure and RBAC permissions.
 * Provides functionality for creating, reading, updating, and deleting categories,
 * as well as permission checking and tree structure building.
 */
export class KBCategoryService {
  /**
   * Generate URL-friendly slug from category name
   * Converts "IT Support & Help" to "it-support-help"
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  /**
   * Generate full path for category (e.g., "Parent > Child > Grandchild")
   * Used for breadcrumbs and display
   */
  private static async generateFullPath(
    categoryId: string | undefined,
    orgId: string,
    categoryName: string
  ): Promise<string> {
    if (!categoryId) {
      return categoryName
    }

    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const pathParts: string[] = [categoryName]
    let currentParentId: string | undefined = categoryId

    // Traverse up the tree to build path (limit to 10 levels to prevent infinite loops)
    for (let i = 0; i < 10 && currentParentId; i++) {
      const parent: KBCategory | null = await collection.findOne({
        _id: new ObjectId(currentParentId),
        orgId,
      })

      if (parent) {
        pathParts.unshift(parent.name)
        currentParentId = parent.parentId
      } else {
        break
      }
    }

    return pathParts.join(' > ')
  }

  /**
   * Check for circular parent references
   * Returns true if adding parentId to categoryId would create a cycle
   */
  private static async wouldCreateCircularReference(
    categoryId: string,
    parentId: string,
    orgId: string
  ): Promise<boolean> {
    if (categoryId === parentId) {
      return true
    }

    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    let currentParentId: string | undefined = parentId

    // Traverse up the tree to check if we hit categoryId (limit to 10 levels)
    for (let i = 0; i < 10 && currentParentId; i++) {
      if (currentParentId === categoryId) {
        return true
      }

      const parent: KBCategory | null = await collection.findOne({
        _id: new ObjectId(currentParentId),
        orgId,
      })

      if (parent) {
        currentParentId = parent.parentId
      } else {
        break
      }
    }

    return false
  }

  /**
   * Create a new KB category
   */
  static async createCategory(
    orgId: string,
    input: CreateKBCategoryInput,
    createdBy: string
  ): Promise<KBCategory> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    // Generate slug from name
    const slug = this.generateSlug(input.name)

    // Check if slug already exists for this org
    const existing = await collection.findOne({ orgId, slug, isActive: true })
    if (existing) {
      throw new Error(`Category with name '${input.name}' already exists (slug: ${slug})`)
    }

    // Check for circular reference if parentId is provided
    if (input.parentId) {
      const parentExists = await collection.findOne({
        _id: new ObjectId(input.parentId),
        orgId,
        isActive: true,
      })

      if (!parentExists) {
        throw new Error('Parent category not found')
      }
    }

    // Generate full path
    const fullPath = await this.generateFullPath(input.parentId, orgId, input.name)

    // Create category
    const now = new Date()
    const category: KBCategory = {
      _id: new ObjectId(),
      orgId,
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon || 'BookOpen',
      color: input.color || '#6366f1',
      parentId: input.parentId,
      fullPath,
      order: input.order ?? 0,
      isActive: true,
      isPublic: input.isPublic ?? false,
      allowedRoles: input.allowedRoles,
      allowedUsers: input.allowedUsers,
      permissions: input.permissions,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    await collection.insertOne(category)
    return category
  }

  /**
   * Get all categories for an organization (flat list)
   */
  static async getAllCategories(
    orgId: string,
    includeInactive: boolean = false
  ): Promise<KBCategory[]> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const query: any = { orgId }
    if (!includeInactive) {
      query.isActive = true
    }

    const categories = await collection
      .find(query)
      .sort({ order: 1, name: 1 })
      .toArray()

    // Calculate article count for each category
    const articlesCollection = db.collection(COLLECTIONS.KB_ARTICLES)
    for (const category of categories) {
      const count = await articlesCollection.countDocuments({
        orgId,
        category: category._id.toString(),
        isArchived: false,
      })
      category.articleCount = count
    }

    return categories
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(
    id: string,
    orgId: string
  ): Promise<KBCategory | null> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const category = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (category) {
      // Calculate article count
      const articlesCollection = db.collection(COLLECTIONS.KB_ARTICLES)
      const count = await articlesCollection.countDocuments({
        orgId,
        category: id,
        isArchived: false,
      })
      category.articleCount = count
    }

    return category
  }

  /**
   * Update category
   */
  static async updateCategory(
    id: string,
    orgId: string,
    updates: UpdateKBCategoryInput
  ): Promise<KBCategory | null> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    // Get existing category
    const existing = await collection.findOne({ _id: new ObjectId(id), orgId })
    if (!existing) {
      throw new Error('Category not found')
    }

    // Check for circular reference if parentId is being changed
    if (updates.parentId && updates.parentId !== existing.parentId) {
      const wouldCycle = await this.wouldCreateCircularReference(
        id,
        updates.parentId,
        orgId
      )
      if (wouldCycle) {
        throw new Error('Cannot set parent: would create circular reference')
      }

      // Verify parent exists
      const parentExists = await collection.findOne({
        _id: new ObjectId(updates.parentId),
        orgId,
        isActive: true,
      })
      if (!parentExists) {
        throw new Error('Parent category not found')
      }
    }

    // If name is being changed, regenerate slug and check for conflicts
    let slug = existing.slug
    if (updates.name && updates.name !== existing.name) {
      slug = this.generateSlug(updates.name)
      const slugConflict = await collection.findOne({
        orgId,
        slug,
        _id: { $ne: new ObjectId(id) },
        isActive: true,
      })
      if (slugConflict) {
        throw new Error(`Category with name '${updates.name}' already exists`)
      }
    }

    // Regenerate full path if name or parentId changed
    let fullPath = existing.fullPath
    const nameChanged = updates.name && updates.name !== existing.name
    const parentChanged = updates.parentId !== undefined && updates.parentId !== existing.parentId

    if (nameChanged || parentChanged) {
      const newName = updates.name || existing.name
      const newParentId = parentChanged ? updates.parentId : existing.parentId
      fullPath = await this.generateFullPath(newParentId, orgId, newName)
    }

    // Build update data
    const updateData: any = {
      ...updates,
      slug,
      fullPath,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // If this category's name or parentId changed, update fullPath for all children
    if (result && (nameChanged || parentChanged)) {
      await this.updateChildrenFullPaths(id, orgId)
    }

    return result
  }

  /**
   * Recursively update fullPath for all children of a category
   * Called when a parent category's name or parentId changes
   */
  private static async updateChildrenFullPaths(
    parentId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    // Find all direct children
    const children = await collection.find({ orgId, parentId, isActive: true }).toArray()

    for (const child of children) {
      const newFullPath = await this.generateFullPath(
        parentId,
        orgId,
        child.name
      )

      await collection.updateOne(
        { _id: child._id },
        {
          $set: {
            fullPath: newFullPath,
            updatedAt: new Date(),
          },
        }
      )

      // Recursively update grandchildren
      await this.updateChildrenFullPaths(child._id.toString(), orgId)
    }
  }

  /**
   * Delete category (soft delete)
   * Only allowed if no articles exist in the category
   */
  static async deleteCategory(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    // Check if category exists
    const category = await collection.findOne({ _id: new ObjectId(id), orgId })
    if (!category) {
      return false
    }

    // Check if any articles exist in this category
    const articlesCollection = db.collection(COLLECTIONS.KB_ARTICLES)
    const articleCount = await articlesCollection.countDocuments({
      orgId,
      category: id,
      isArchived: false,
    })

    if (articleCount > 0) {
      throw new Error(
        `Cannot delete category: ${articleCount} article(s) exist in this category. ` +
        'Please move or delete articles first.'
      )
    }

    // Check if any child categories exist
    const childCount = await collection.countDocuments({
      orgId,
      parentId: id,
      isActive: true,
    })

    if (childCount > 0) {
      throw new Error(
        `Cannot delete category: ${childCount} subcategorie(s) exist. ` +
        'Please move or delete subcategories first.'
      )
    }

    // Soft delete
    const result = await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Get hierarchical category tree
   * Returns categories organized in parent-child structure
   */
  static async getCategoryTree(orgId: string): Promise<KBCategoryTreeNode[]> {
    const categories = await this.getAllCategories(orgId)
    return this.buildCategoryTree(categories)
  }

  /**
   * Build category tree from flat list
   * Helper function to convert flat array into hierarchical structure
   */
  static buildCategoryTree(
    categories: KBCategory[],
    parentId: string | undefined = undefined,
    level: number = 0
  ): KBCategoryTreeNode[] {
    const nodes: KBCategoryTreeNode[] = []

    // Find categories with matching parentId
    const children = categories.filter((cat) => cat.parentId === parentId)

    for (const category of children) {
      const node: KBCategoryTreeNode = {
        ...category,
        level,
        children: this.buildCategoryTree(
          categories,
          category._id.toString(),
          level + 1
        ),
      }
      nodes.push(node)
    }

    // Sort by order, then by name
    return nodes.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Get full path array for breadcrumbs
   * Returns array of categories from root to target
   */
  static async getCategoryPath(
    categoryId: string,
    orgId: string
  ): Promise<KBCategory[]> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const path: KBCategory[] = []

    // Get the target category
    const category = await collection.findOne({
      _id: new ObjectId(categoryId),
      orgId,
    })

    if (!category) {
      return path
    }

    path.unshift(category)

    // Traverse up to root
    let currentParentId = category.parentId
    for (let i = 0; i < 10 && currentParentId; i++) {
      const parent: KBCategory | null = await collection.findOne({
        _id: new ObjectId(currentParentId),
        orgId,
      })

      if (parent) {
        path.unshift(parent)
        currentParentId = parent.parentId
      } else {
        break
      }
    }

    return path
  }

  /**
   * Get article count for a category
   */
  static async getArticleCount(categoryId: string, orgId: string): Promise<number> {
    const db = await getDatabase()
    const articlesCollection = db.collection(COLLECTIONS.KB_ARTICLES)

    return await articlesCollection.countDocuments({
      orgId,
      category: categoryId,
      isArchived: false,
    })
  }

  /**
   * Check if user has permission to access category
   *
   * RBAC Integration Points:
   * 1. Check if category.isPublic (always accessible)
   * 2. Check if user's role is in category.allowedRoles
   * 3. Check if user's ID is in category.allowedUsers
   * 4. Check if user has required permissions via PermissionService
   *
   * @param categoryId - Category ID
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param action - Action type: 'view', 'contribute', 'manage'
   * @returns True if user has permission
   */
  static async checkCategoryPermission(
    categoryId: string,
    userId: string,
    orgId: string,
    action: 'view' | 'contribute' | 'manage' = 'view'
  ): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)
    const usersCollection = db.collection(COLLECTIONS.USERS)

    // Get category
    const category = await collection.findOne({
      _id: new ObjectId(categoryId),
      orgId,
      isActive: true,
    })

    if (!category) {
      return false
    }

    // 1. Public categories are always viewable
    if (action === 'view' && category.isPublic) {
      return true
    }

    // Get user
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      orgId,
      isActive: true,
    })

    if (!user) {
      return false
    }

    // 2. Check if user is in allowedUsers (explicit grant)
    if (category.allowedUsers && category.allowedUsers.includes(userId)) {
      return true
    }

    // 3. Check if user's role is in allowedRoles
    if (category.allowedRoles && user.roleId) {
      if (category.allowedRoles.includes(user.roleId.toString())) {
        return true
      }
    }

    // 4. Check permission-based access via RBAC system
    if (category.permissions) {
      const requiredPermissions = category.permissions[action]
      if (requiredPermissions && requiredPermissions.length > 0) {
        // User needs at least one of the required permissions
        const hasPermission = await PermissionService.hasAnyPermission(
          userId,
          orgId,
          requiredPermissions
        )
        if (hasPermission) {
          return true
        }
      }
    }

    // 5. Fallback: Check basic KB permissions for action
    const basicPermissionMap = {
      view: 'kb.view',
      contribute: 'kb.create',
      manage: 'settings.edit', // Managing categories requires settings permission
    }

    return await PermissionService.hasPermission(
      userId,
      orgId,
      basicPermissionMap[action]
    )
  }

  /**
   * Get categories accessible by user (respects RBAC)
   * Returns only categories the user has permission to view
   */
  static async getCategoriesForUser(
    userId: string,
    orgId: string,
    includeInactive: boolean = false
  ): Promise<KBCategory[]> {
    const allCategories = await this.getAllCategories(orgId, includeInactive)
    const accessibleCategories: KBCategory[] = []

    for (const category of allCategories) {
      const hasAccess = await this.checkCategoryPermission(
        category._id.toString(),
        userId,
        orgId,
        'view'
      )
      if (hasAccess) {
        accessibleCategories.push(category)
      }
    }

    return accessibleCategories
  }

  /**
   * Seed default categories for new organization
   */
  static async seedDefaultCategories(
    orgId: string,
    createdBy: string = 'system'
  ): Promise<void> {
    const defaultCategories: CreateKBCategoryInput[] = [
      {
        name: 'Getting Started',
        description: 'Essential guides and tutorials for new users',
        icon: 'Rocket',
        color: '#3b82f6',
        order: 1,
        isPublic: true,
      },
      {
        name: 'IT Support',
        description: 'Technical support articles and troubleshooting guides',
        icon: 'Wrench',
        color: '#8b5cf6',
        order: 2,
        isPublic: false,
      },
      {
        name: 'Software & Applications',
        description: 'Guides for common software and applications',
        icon: 'AppWindow',
        color: '#10b981',
        order: 3,
        isPublic: false,
      },
      {
        name: 'Hardware & Devices',
        description: 'Hardware setup, maintenance, and troubleshooting',
        icon: 'HardDrive',
        color: '#f59e0b',
        order: 4,
        isPublic: false,
      },
      {
        name: 'Security & Compliance',
        description: 'Security best practices and compliance guidelines',
        icon: 'Shield',
        color: '#ef4444',
        order: 5,
        isPublic: false,
      },
      {
        name: 'Policies & Procedures',
        description: 'Company policies and standard operating procedures',
        icon: 'FileText',
        color: '#6366f1',
        order: 6,
        isPublic: false,
      },
      {
        name: 'FAQs',
        description: 'Frequently asked questions',
        icon: 'HelpCircle',
        color: '#06b6d4',
        order: 7,
        isPublic: true,
      },
    ]

    for (const categoryInput of defaultCategories) {
      try {
        await this.createCategory(orgId, categoryInput, createdBy)
      } catch (error) {
        console.log(`Category '${categoryInput.name}' already exists, skipping`)
      }
    }
  }
}
