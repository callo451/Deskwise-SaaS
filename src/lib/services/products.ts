import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { Product, ProductMetrics, ProductCategory, ProductType } from '@/lib/types'

export class ProductService {
  /**
   * Get all products for an organization with optional filters
   */
  static async getProducts(
    orgId: string,
    filters?: {
      category?: ProductCategory
      type?: ProductType
      isActive?: boolean
      search?: string
      includeArchived?: boolean
    }
  ): Promise<Product[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.type) {
      query.type = filters.type
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    if (!filters?.includeArchived) {
      query.isArchived = { $ne: true }
    }

    if (filters?.search) {
      query.$or = [
        { sku: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
      ]
    }

    const products = await db
      .collection<Product>('products')
      .find(query)
      .sort({ timesUsed: -1, name: 1 }) // Most used first, then alphabetical
      .toArray()

    return products
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(
    id: string,
    orgId: string
  ): Promise<Product | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const product = await db.collection<Product>('products').findOne({
      _id: new ObjectId(id),
      orgId,
    })

    return product
  }

  /**
   * Get a product by SKU
   */
  static async getProductBySku(
    sku: string,
    orgId: string
  ): Promise<Product | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const product = await db.collection<Product>('products').findOne({
      sku,
      orgId,
    })

    return product
  }

  /**
   * Create a new product
   */
  static async createProduct(
    orgId: string,
    data: Partial<Product>,
    createdBy: string
  ): Promise<Product> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Check if SKU already exists
    const existingProduct = await this.getProductBySku(data.sku!, orgId)
    if (existingProduct) {
      throw new Error(`Product with SKU "${data.sku}" already exists`)
    }

    const now = new Date()

    const product: Omit<Product, '_id'> = {
      orgId,
      sku: data.sku!,
      name: data.name!,
      description: data.description!,
      longDescription: data.longDescription,
      category: data.category!,
      type: data.type!,
      subcategory: data.subcategory,
      unitPrice: data.unitPrice!,
      cost: data.cost,
      unitOfMeasure: data.unitOfMeasure!,
      minimumQuantity: data.minimumQuantity,
      defaultQuantity: data.defaultQuantity || 1,
      taxCategory: data.taxCategory || 'taxable',
      isTaxable: data.isTaxable !== undefined ? data.isTaxable : true,
      recurringInterval: data.recurringInterval,
      vendor: data.vendor,
      manufacturer: data.manufacturer,
      partNumber: data.partNumber,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isArchived: false,
      inStock: data.inStock,
      stockQuantity: data.stockQuantity,
      imageUrl: data.imageUrl,
      internalNotes: data.internalNotes,
      tags: data.tags || [],
      timesUsed: 0,
      lastUsedAt: undefined,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('products').insertOne(product)

    return {
      ...product,
      _id: result.insertedId,
    } as Product
  }

  /**
   * Update a product
   */
  static async updateProduct(
    id: string,
    orgId: string,
    data: Partial<Product>,
    updatedBy: string
  ): Promise<Product | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // If updating SKU, check it doesn't conflict
    if (data.sku) {
      const existingProduct = await this.getProductBySku(data.sku, orgId)
      if (existingProduct && existingProduct._id.toString() !== id) {
        throw new Error(`Product with SKU "${data.sku}" already exists`)
      }
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
      updatedBy,
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id
    delete updateData.orgId
    delete updateData.createdAt
    delete updateData.createdBy
    delete updateData.timesUsed
    delete updateData.lastUsedAt

    const result = await db.collection<Product>('products').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete a product (soft delete by archiving)
   */
  static async deleteProduct(id: string, orgId: string): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('products').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          isArchived: true,
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Permanently delete a product
   */
  static async permanentlyDeleteProduct(
    id: string,
    orgId: string
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('products').deleteOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Increment product usage counter
   */
  static async incrementUsageCount(id: string, orgId: string): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('products').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $inc: { timesUsed: 1 },
        $set: { lastUsedAt: new Date() },
      }
    )
  }

  /**
   * Bulk increment usage for multiple products
   */
  static async bulkIncrementUsage(
    productIds: string[],
    orgId: string
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const objectIds = productIds.map((id) => new ObjectId(id))

    await db.collection('products').updateMany(
      {
        _id: { $in: objectIds },
        orgId,
      },
      {
        $inc: { timesUsed: 1 },
        $set: { lastUsedAt: new Date() },
      }
    )
  }

  /**
   * Get product metrics for dashboard
   */
  static async getProductMetrics(orgId: string): Promise<ProductMetrics> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const products = await db
      .collection<Product>('products')
      .find({ orgId, isArchived: { $ne: true } })
      .toArray()

    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.isActive).length
    const inactiveProducts = products.filter((p) => !p.isActive).length

    // Count by category
    const byCategory: Partial<Record<ProductCategory, number>> = {}
    products.forEach((p) => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1
    })

    // Count by type
    const byType: Partial<Record<ProductType, number>> = {}
    products.forEach((p) => {
      byType[p.type] = (byType[p.type] || 0) + 1
    })

    // Top used products
    const topUsedProducts = products
      .filter((p) => p.timesUsed && p.timesUsed > 0)
      .sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0))
      .slice(0, 10)
      .map((p) => ({
        product: p,
        usageCount: p.timesUsed || 0,
      }))

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      byCategory: byCategory as Record<ProductCategory, number>,
      byType: byType as Record<ProductType, number>,
      topUsedProducts,
    }
  }

  /**
   * Duplicate a product (for creating variations)
   */
  static async duplicateProduct(
    id: string,
    orgId: string,
    createdBy: string
  ): Promise<Product> {
    const original = await this.getProductById(id, orgId)
    if (!original) {
      throw new Error('Product not found')
    }

    // Generate new SKU
    const baseSku = original.sku
    let newSku = `${baseSku}-COPY`
    let counter = 1

    // Ensure unique SKU
    while (await this.getProductBySku(newSku, orgId)) {
      newSku = `${baseSku}-COPY-${counter}`
      counter++
    }

    const duplicateData: Partial<Product> = {
      ...original,
      sku: newSku,
      name: `${original.name} (Copy)`,
      timesUsed: 0,
      lastUsedAt: undefined,
    }

    delete (duplicateData as any)._id
    delete (duplicateData as any).createdAt
    delete (duplicateData as any).updatedAt

    return await this.createProduct(orgId, duplicateData, createdBy)
  }

  /**
   * Import products from CSV/Array
   */
  static async bulkImportProducts(
    orgId: string,
    products: Array<Partial<Product>>,
    createdBy: string
  ): Promise<{
    success: number
    failed: number
    errors: Array<{ sku: string; error: string }>
  }> {
    let success = 0
    let failed = 0
    const errors: Array<{ sku: string; error: string }> = []

    for (const productData of products) {
      try {
        await this.createProduct(orgId, productData, createdBy)
        success++
      } catch (error: any) {
        failed++
        errors.push({
          sku: productData.sku || 'unknown',
          error: error.message,
        })
      }
    }

    return { success, failed, errors }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    orgId: string,
    category: ProductCategory
  ): Promise<Product[]> {
    return this.getProducts(orgId, { category, isActive: true })
  }

  /**
   * Search products
   */
  static async searchProducts(
    orgId: string,
    query: string
  ): Promise<Product[]> {
    return this.getProducts(orgId, { search: query, isActive: true })
  }
}
