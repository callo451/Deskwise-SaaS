import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { AssetCategory } from '../types'

export interface CreateAssetCategoryInput {
  name: string
  code: string
  icon?: string
  color?: string
  description?: string
  parentId?: string
  customFields?: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'dropdown'
    required: boolean
    options?: string[]
  }>
}

export interface UpdateAssetCategoryInput {
  name?: string
  code?: string
  icon?: string
  color?: string
  description?: string
  parentId?: string
  isActive?: boolean
  customFields?: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'dropdown'
    required: boolean
    options?: string[]
  }>
}

export class AssetCategoryService {
  /**
   * Create a new asset category
   */
  static async createCategory(
    orgId: string,
    input: CreateAssetCategoryInput,
    createdBy: string,
    isSystem: boolean = false
  ): Promise<AssetCategory> {
    const db = await getDatabase()
    const collection = db.collection<AssetCategory>(COLLECTIONS.ASSET_CATEGORIES)

    // Check if code already exists for this org
    const existing = await collection.findOne({ orgId, code: input.code, isActive: true })
    if (existing) {
      throw new Error(`Category with code '${input.code}' already exists`)
    }

    const category: AssetCategory = {
      _id: new ObjectId(),
      orgId,
      name: input.name,
      code: input.code.toUpperCase(),
      icon: input.icon,
      color: input.color || '#6366f1',
      description: input.description,
      isSystem,
      isActive: true,
      parentId: input.parentId,
      customFields: input.customFields,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(category)
    return category
  }

  /**
   * Get all categories for an organization
   */
  static async getCategories(
    orgId: string,
    includeInactive: boolean = false
  ): Promise<AssetCategory[]> {
    const db = await getDatabase()
    const collection = db.collection<AssetCategory>(COLLECTIONS.ASSET_CATEGORIES)

    const query: any = { orgId }
    if (!includeInactive) {
      query.isActive = true
    }

    const categories = await collection
      .find(query)
      .sort({ isSystem: -1, name: 1 })
      .toArray()

    return categories
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(
    id: string,
    orgId: string
  ): Promise<AssetCategory | null> {
    const db = await getDatabase()
    const collection = db.collection<AssetCategory>(COLLECTIONS.ASSET_CATEGORIES)

    const category = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    return category
  }

  /**
   * Update category
   */
  static async updateCategory(
    id: string,
    orgId: string,
    updates: UpdateAssetCategoryInput
  ): Promise<AssetCategory | null> {
    const db = await getDatabase()
    const collection = db.collection<AssetCategory>(COLLECTIONS.ASSET_CATEGORIES)

    // Don't allow updating code if it would conflict
    if (updates.code) {
      const existing = await collection.findOne({
        orgId,
        code: updates.code.toUpperCase(),
        _id: { $ne: new ObjectId(id) },
        isActive: true,
      })
      if (existing) {
        throw new Error(`Category with code '${updates.code}' already exists`)
      }
      updates.code = updates.code.toUpperCase()
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete category (soft delete)
   * Only allow deleting custom categories, not system categories
   */
  static async deleteCategory(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<AssetCategory>(COLLECTIONS.ASSET_CATEGORIES)

    // Check if it's a system category
    const category = await collection.findOne({ _id: new ObjectId(id), orgId })
    if (!category) {
      return false
    }

    if (category.isSystem) {
      throw new Error('Cannot delete system categories')
    }

    // TODO: Check if any assets are using this category before deleting
    // For now, just soft delete
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
   * Seed default system categories for a new organization
   */
  static async seedDefaultCategories(
    orgId: string,
    createdBy: string = 'system'
  ): Promise<void> {
    const defaultCategories: CreateAssetCategoryInput[] = [
      {
        name: 'Computer',
        code: 'COMP',
        icon: 'Monitor',
        color: '#3b82f6',
        description: 'Desktop computers and workstations',
      },
      {
        name: 'Laptop',
        code: 'LPTOP',
        icon: 'Laptop',
        color: '#8b5cf6',
        description: 'Portable laptop computers',
      },
      {
        name: 'Server',
        code: 'SRV',
        icon: 'Server',
        color: '#ef4444',
        description: 'Physical and virtual servers',
      },
      {
        name: 'Network Device',
        code: 'NET',
        icon: 'Network',
        color: '#10b981',
        description: 'Routers, switches, firewalls, and access points',
      },
      {
        name: 'Mobile Device',
        code: 'MOB',
        icon: 'Smartphone',
        color: '#f59e0b',
        description: 'Smartphones and tablets',
      },
      {
        name: 'Printer',
        code: 'PRNT',
        icon: 'Printer',
        color: '#6366f1',
        description: 'Printers and multifunction devices',
      },
      {
        name: 'Monitor',
        code: 'MON',
        icon: 'Monitor',
        color: '#06b6d4',
        description: 'Display monitors',
      },
      {
        name: 'Peripheral',
        code: 'PRPH',
        icon: 'HardDrive',
        color: '#84cc16',
        description: 'Keyboards, mice, and other peripherals',
      },
      {
        name: 'Software License',
        code: 'SOFT',
        icon: 'FileCode',
        color: '#ec4899',
        description: 'Software licenses and subscriptions',
      },
      {
        name: 'Other',
        code: 'OTHER',
        icon: 'Box',
        color: '#64748b',
        description: 'Miscellaneous assets',
      },
    ]

    for (const categoryInput of defaultCategories) {
      try {
        await this.createCategory(orgId, categoryInput, createdBy, true)
      } catch (error) {
        // Skip if already exists
        console.log(`Category ${categoryInput.code} already exists, skipping`)
      }
    }
  }

  /**
   * Get hierarchical category tree
   */
  static async getCategoryTree(orgId: string): Promise<AssetCategory[]> {
    const categories = await this.getCategories(orgId)

    // Build parent-child relationships
    const categoryMap = new Map<string, AssetCategory & { children?: AssetCategory[] }>()
    const rootCategories: (AssetCategory & { children?: AssetCategory[] })[] = []

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), { ...cat, children: [] })
    })

    // Second pass: build tree
    categories.forEach((cat) => {
      const categoryWithChildren = categoryMap.get(cat._id.toString())!
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children!.push(categoryWithChildren)
        } else {
          rootCategories.push(categoryWithChildren)
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories as AssetCategory[]
  }
}
